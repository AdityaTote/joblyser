import json
import re
from typing import Any, cast

from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import ValidationError

from app.core.prompts import (
  JD_EXTRACTOR_PROMPT,
  SEARCH_COMPANY_PROMPT,
  JOB_PROFILE_PROMPT,
  COMPARE_USER_SKILLS_TO_JD_PROMPT,
  COVER_LETTER_PROMPT,
  LINKEDIN_NOTE_PROMPT,
  COLD_MAIL_PROMPT
)
from app.schema.state import(
  ActionEnum,
  AgentState,
  ApplyNodeOutput,
  ColdMail,
  ColdMailNodeOutput,
  CompanyInfo,
  CoverLetterBody,
  CoverLetterHeader,
  CoverLetterNodeOutput,
  CoverLetterSignOff,
  JDRequirements,
  LinkedInNoteContent,
  LinkedInNoteNodeOutput,
  ReviewNodeOutput,
  RoleFitOutput,
  UserDocumentRef,
  CoverLetterContent
)
from .llm import TaskEnum, llm
from .tools import user_data_tool, search_tool, set_user_document_registry
from .utils.node import parse_json_payload, extract_jd_requirements_fallback
from .utils.user_context import (
  build_user_context_plan,
  build_user_profile_structured,
  empty_user_profile_structured,
  flatten_retrieved_chunks,
  resolve_document_type,
)

ACTION_ROUTE_MAP: dict[ActionEnum, str] = {
  ActionEnum.GENERATE_APPLY_NOTE: "apply_note",
  ActionEnum.GENERATE_COVER_LETTER: "cover_letter",
  ActionEnum.GENERATE_LINKEDIN_NOTE: "linkedin_note",
  ActionEnum.GENERATE_COLD_MAIL: "cold_mail",
}



def _normalize_text_output(content: object) -> str:
  text = content if isinstance(content, str) else str(content)
  text = text.strip()

  parsed = parse_json_payload(text)
  if isinstance(parsed, str):
    text = parsed.strip()

  text = text.replace("\\r\\n", "\n").replace("\\n", "\n").replace("\\t", "\t")
  return text.strip()


def _coerce_cold_mail_output(content: object) -> ColdMail:
  parsed = parse_json_payload(content)

  if isinstance(parsed, dict):
    if isinstance(parsed.get("cold_mail"), dict):
      parsed = cast(dict[str, Any], parsed.get("cold_mail"))

    if "tool_code" in parsed:
      return ColdMail(subject="", email_body="")

    subject_value = parsed.get("subject")
    body_value = parsed.get("email_body")

    if body_value is None:
      body_value = parsed.get("body") or parsed.get("mail_body")

    subject = subject_value.strip() if isinstance(subject_value, str) else str(subject_value or "").strip()
    email_body = body_value.strip() if isinstance(body_value, str) else str(body_value or "").strip()

    if subject or email_body:
      return ColdMail(subject=subject, email_body=email_body)

  plain_text = _normalize_text_output(content)
  subject_match = re.search(r"^\s*subject\s*:\s*(.+)$", plain_text, flags=re.IGNORECASE | re.MULTILINE)
  if subject_match:
    subject = subject_match.group(1).strip()
    first_line_end = plain_text.find("\n")
    email_body = plain_text[first_line_end + 1:].strip() if first_line_end != -1 else ""
    return ColdMail(subject=subject, email_body=email_body)

  return ColdMail(subject="", email_body=plain_text)

_JD_STRING_KEYS = {
  "company",
  "job_title",
  "role_title",
  "seniority_level",
  "domain_or_industry",
  "experience_years",
}

_JD_LIST_KEYS = {
  "required_skills",
  "preferred_skills",
  "responsibilities",
  "technologies",
  "soft_skills",
}


def _sanitize_jd_requirements(payload: Any) -> JDRequirements:
  if not isinstance(payload, dict):
    return cast(JDRequirements, {})

  cleaned: dict[str, Any] = {}

  for key in _JD_STRING_KEYS:
    value = payload.get(key)
    if value is None:
      continue
    if isinstance(value, str):
      normalized = value.strip()
    else:
      normalized = str(value).strip()
    if normalized:
      cleaned[key] = normalized

  for key in _JD_LIST_KEYS:
    value = payload.get(key)
    if value is None:
      continue

    normalized_items: list[str] = []
    if isinstance(value, list):
      normalized_items = [str(item).strip() for item in value if str(item).strip()]
    elif isinstance(value, str):
      stripped = value.strip()
      if stripped:
        normalized_items = [stripped]

    if normalized_items:
      cleaned[key] = normalized_items

  return cast(JDRequirements, cleaned)

def router(state: AgentState):
    return {
      "action": state.action
    }

def ensure_jd(state: AgentState):
    if state.jd_requirements:
        return {}
    return extract_jd_requirements(state)

def what_is_job(state: AgentState) -> dict[str, Any]:
  """
    Determine what the job is.
  """
  system_prompt = SystemMessage(content=JOB_PROFILE_PROMPT)
  user_message = HumanMessage(content=json.dumps({
    "jd_requirements": state.jd_requirements,
  }, ensure_ascii=False))
  result = llm.run(messages=[system_prompt, user_message], task="extraction")
  return {
    "job_profile":  _normalize_text_output(result.content)
  }

def extract_jd_requirements(state: AgentState) -> dict[str, Any]:
  """
    extract the job requirements from job description given in state
  """
  system_message = SystemMessage(content=JD_EXTRACTOR_PROMPT)
  user_message = HumanMessage(content=state.jd_text)
  result = llm.run(messages=[system_message, user_message], task="extraction", schema=JDRequirements)

  parsed = parse_json_payload(result)
  updates: dict[str, Any] = {}

  if isinstance(parsed, dict):
    updates["jd_requirements"] = _sanitize_jd_requirements(parsed)
  else:
    updates["jd_requirements"] = _sanitize_jd_requirements(extract_jd_requirements_fallback(state.jd_text))

  if not state.agent_query:
    updates["agent_query"] = state.user_query

  return {
    "jd_requirements": updates["jd_requirements"]
  }

def route_after_jd(state: AgentState):
    if state.action == ActionEnum.REVIEW:
        return "review_flow"
    return "generation_flow"

def route_enrichment(state: AgentState):
  return ["what_is_job", "user_context", "search_company"]

def search_about_company(state: AgentState) -> dict[str, Any]:
  company_name = state.jd_requirements.get("company") if isinstance(state.jd_requirements, dict) else None
  
  search_result = search_tool.invoke({
    "query": company_name,
    "topic": "general",
  })

  system_message = SystemMessage(content=SEARCH_COMPANY_PROMPT)
  user_message = HumanMessage(content=json.dumps({
    "company_name": company_name,
    "search_result": search_result,
  }, ensure_ascii=False))

  result = llm.run(messages=[system_message, user_message], task=TaskEnum.FAST, schema=CompanyInfo, tools=[search_tool])

  return {
    "company_info": cast(CompanyInfo | None, parse_json_payload(result))
  }

def get_user_context(state: AgentState) -> dict[str, Any]:
    """
    Generate the user-focused RAG query, resolve the user's document, and fetch context.
    """
    plan = build_user_context_plan(state)
    needs_user_context = plan["needs_user_context"]
    agent_query = plan["agent_query"]

    if not needs_user_context:
        return {
            "user_profile_structured": empty_user_profile_structured(),
            "agent_query": agent_query
        }

    selected_document: UserDocumentRef = plan["selected_document"] or {}
    document_id = selected_document.get("document_id") or state.doc_key

    key = selected_document.get("key") or state.rag_key or document_id
    if not key:
      return {
        "user_profile_structured": empty_user_profile_structured(),
        "agent_query": agent_query
      }

    raw_document_type = (
        selected_document.get("document_type")
        or state.rag_document_type
        or _infer_document_type(key)
    )
    document_type = resolve_document_type(str(raw_document_type).lower())

    try:
      retrieved = user_data_tool.invoke({
        "query": agent_query,
        "user_id": state.user_id,
        "document_id": document_id,
        "document_type": document_type.value,
        "key": key,
      })
    except Exception as exc:
      print(f"[agent:get_user_context] Failed to retrieve user context: {exc}")
      return {
        "user_profile_structured": empty_user_profile_structured(),
        "agent_query": agent_query
      }

    flattened_docs = flatten_retrieved_chunks(retrieved)
    print(f"[agent:get_user_context] user context: {flattened_docs}")

    return {
        "user_profile_structured": build_user_profile_structured(flattened_docs),
        "agent_query": agent_query
    }


def _infer_document_type(key: str | None) -> str:
    """Infer document type from file extension."""
    if not key:
        return "pdf"
    ext = key.rsplit(".", 1)[-1].lower() if "." in key else "pdf"
    return ext


def _register_state_document_for_tools(state: AgentState) -> None:
  if not state.user_id or not state.doc_key:
    set_user_document_registry([])
    return

  key = (state.rag_key or state.doc_key).strip()
  raw_document_type = (state.rag_document_type or _infer_document_type(key)).lower()
  document_type = resolve_document_type(raw_document_type).value

  set_user_document_registry([{
    "user_id": state.user_id,
    "document_id": state.doc_key,
    "document_type": document_type,
    "key": key,
  }])


def compare_user_skills_to_jd(state: AgentState) -> dict[str, Any]:
  """
    Compare the user's skills and experience to the JD requirements, and provide a fit analysis.
  """
  system_message = SystemMessage(content=COMPARE_USER_SKILLS_TO_JD_PROMPT)
  user_message = HumanMessage(content=json.dumps({
    "user_profile": state.user_profile_structured,
    "jd_requirements": state.jd_requirements,
  }, ensure_ascii=False))
  result = llm.run([system_message, user_message], task=TaskEnum.FAST, schema=RoleFitOutput)
  if result is not None:
    role_fit = RoleFitOutput.model_validate(result)
  else:
    role_fit = RoleFitOutput()

  return {
    "role_fit": role_fit
  }

def gen_router(state: AgentState):
  return {
    "action": state.action
  }

def route_generation(state: AgentState):
  if state.action == ActionEnum.GENERATE_APPLY_NOTE:
    return "apply_note"
  elif state.action == ActionEnum.GENERATE_COLD_MAIL:
    return "cold_mail"
  elif state.action == ActionEnum.GENERATE_COVER_LETTER:
    return "cover_letter"
  else:
    return "linkedin_note"


MAX_RETRIES = 3

PARAGRAPH_KEYS = [
	"paragraph_1_hook",
	"paragraph_2_proof",
	"paragraph_3_company_fit",
	"paragraph_4_complete_picture",
	"paragraph_5_cta",
]

def _normalize_body(cl: dict) -> dict:
	"""
	Handles 3 failure patterns the LLM produces:
	  1. body is a flat string  → split by double newline into paragraph keys
	  2. body keys are missing  → rebuild from whatever is present
	  3. body is correct object → pass through unchanged
	"""
	body = cl.get("body")

	if body is None:
		# Body missing entirely — check if paragraphs are at the wrong level
		misplaced = {k: cl.pop(k) for k in PARAGRAPH_KEYS if k in cl}
		if misplaced:
			cl["body"] = misplaced
		else:
			cl["body"] = {k: "" for k in PARAGRAPH_KEYS}

	elif isinstance(body, str):
		# Body is a flat string — split on double newline
		parts = [p.strip() for p in body.split("\n\n") if p.strip()]
		cl["body"] = {
			key: parts[i] if i < len(parts) else ""
			for i, key in enumerate(PARAGRAPH_KEYS)
		}

	elif isinstance(body, dict):
		# Body is correct type — ensure all keys exist
		for key in PARAGRAPH_KEYS:
			if key not in body:
				body[key] = ""

	return cl


def _build_retry_prompt(error: ValidationError) -> str:
	errors = error.errors()
	error_lines = "\n".join([
    f"  - Field '{' -> '.join(str(loc_part) for loc_part in err['loc'])}': {err['msg']}"
		for err in errors
	])
	return f"""
## PREVIOUS ATTEMPT FAILED — CORRECTION REQUIRED

Your previous output failed Pydantic validation with these errors:

{error_lines}

Fix ONLY the failing fields. Return the complete corrected JSON.

### Rules for common failures:

EMPTY PARAGRAPHS:
  - Every paragraph key must contain full substantive text (min 50 characters)
  - Do NOT return empty strings for any paragraph key
  - body must be an object with all 5 keys, not a flat string

BANNED PHRASES in paragraph_1_hook:
  - Do NOT open with: "eager to contribute", "excited to apply",
    "passionate about", "would love to"
  - Open with a FACT: [who you are] + [what you built] + [role + company]
  - ✅ "As a Backend Engineer who built a concurrent Go service, I'm applying
       for the Associate Full Stack Developer role at KloudMate."

STRUCTURE REMINDER — body must be exactly:
{{
  "body": {{
    "paragraph_1_hook": "full text...",
    "paragraph_2_proof": "full text...",
    "paragraph_3_company_fit": "full text...",
    "paragraph_4_complete_picture": "full text...",
    "paragraph_5_cta": "full text..."
  }}
}}
"""


COVER_LETTER_USER_DATA_QUERIES: dict[str, str] = {
  "identity_contact": (
    "candidate full name, email address, phone number, LinkedIn profile URL, "
    "GitHub profile URL, portfolio website URL, current city or location"
  ),
  "skills_technologies": (
    "all programming languages, frameworks, libraries, tools, databases, and cloud platforms "
    "the candidate has used or worked with, including in personal projects, coursework, or "
    "self-learning. Include languages like Go, Rust, Python even if only used in side projects."
  ),
  "projects": (
    "all projects the candidate has built or contributed to, including personal projects, side "
    "projects, open source contributions, academic projects, and freelance work. For each project "
    "extract: project name, technologies used, what was built, and any result or impact."
  ),
  "experience_education": (
    "work experience including internships, part-time jobs, and freelance work. For each role: "
    "company name, role title, duration, and key responsibilities or achievements. Also extract "
    "highest education qualification, institution name, and graduation year."
  ),
}


def _extract_cover_letter_payload(result: Any) -> dict[str, Any] | None:
  if isinstance(result, CoverLetterContent):
    return cast(dict[str, Any], result.model_dump())

  payload: Any = result
  if hasattr(result, "content"):
    payload = parse_json_payload(getattr(result, "content", None))

  if isinstance(payload, dict):
    unwrapped = payload.get("cover_letter", payload)
    if isinstance(unwrapped, dict):
      return cast(dict[str, Any], unwrapped)

  return None


def _retrieve_cover_letter_candidate_data(
  state: AgentState,
  *,
  key: str,
  document_type: str,
) -> dict[str, list[str]]:
  collected: dict[str, list[str]] = {}

  for section, query in COVER_LETTER_USER_DATA_QUERIES.items():
    try:
      retrieved = user_data_tool.invoke({
        "query": query,
        "user_id": state.user_id,
        "document_id": state.doc_key,
        "document_type": document_type,
        "key": key,
      })
    except Exception as exc:
      print(f"[cover_letter] Failed to retrieve section '{section}': {exc}")
      continue

    flattened = flatten_retrieved_chunks(retrieved)
    if flattened:
      collected[section] = flattened

  return collected

def write_cover_letter(state: AgentState) -> dict[str, Any]:
  """
  Write a cover letter that highlights the user's fit for the role
  based on the JD and user context. Retries up to MAX_RETRIES times
  on validation failure, feeding errors back to the LLM each attempt.
  """
  _register_state_document_for_tools(state)

  job_requirements = state.jd_requirements
  user_profile = state.user_profile_structured or empty_user_profile_structured()
  key = (state.rag_key or state.doc_key).strip()
  raw_document_type = (state.rag_document_type or _infer_document_type(key)).lower()
  document_type = resolve_document_type(raw_document_type).value
  candidate_resume_data = _retrieve_cover_letter_candidate_data(
    state,
    key=key,
    document_type=document_type,
  )

  system_context = json.dumps({
    "jd_requirements": job_requirements,
    "user_profile": user_profile,
    "candidate_resume_data": candidate_resume_data,
    "user_id": state.user_id,
    "document_id": state.doc_key,
    "document_type": document_type,
    "key": key,
  }, ensure_ascii=False)

  json_output_guard = (
    "Return ONLY valid JSON with keys: header, body, sign_off. "
    "Do not call tools. Do not include markdown, code fences, or explanations."
  )

  base_messages = [
    SystemMessage(content=COVER_LETTER_PROMPT),
    SystemMessage(content=system_context),
    SystemMessage(content=json_output_guard),
    HumanMessage(content=state.user_query),
  ]

  last_error: ValidationError | None = None
  last_parse_feedback: str | None = None

  for attempt in range(1, MAX_RETRIES + 1):
    messages = base_messages.copy()

    if last_parse_feedback:
      messages.append(HumanMessage(content=last_parse_feedback))

    # On retry, append the validation errors as a follow-up human message
    if attempt > 1 and last_error is not None:
      messages.append(HumanMessage(content=_build_retry_prompt(last_error)))

    result = llm.run(
      messages=messages,
      task=TaskEnum.GEN,
    )

    # Step 1 — parse/unwrap structured output to dict
    parsed = _extract_cover_letter_payload(result)

    if not isinstance(parsed, dict):
      raw_content = getattr(result, "content", result)
      print(f"[cover_letter] Attempt {attempt}: parse_json_payload returned None")
      print(f"[cover_letter] Raw content: {raw_content}")
      last_parse_feedback = (
        "Your previous response was not valid JSON. "
        "Return ONLY one valid JSON object with keys header, body, sign_off."
      )
      continue

    last_parse_feedback = None

    # Step 2 — unwrap outer type wrapper if present
    # handles both { "cover_letter": {...} } and { "type": "...", "cover_letter": {...} }
    cl_data = parsed.get("cover_letter", parsed)

    if not isinstance(cl_data, dict):
      print(f"[cover_letter] Attempt {attempt}: cover_letter value is not a dict: {type(cl_data)}")
      continue

    # Step 3 — normalize body structure before Pydantic sees it
    cl_data = _normalize_body(cl_data)

    # Step 4 — Pydantic validation
    try:
      cover_letter_obj = CoverLetterContent.model_validate(cl_data)
      return {"cover_letter": cover_letter_obj}

    except ValidationError as e:
      last_error = e
      last_parse_feedback = None
      print(f"[cover_letter] Attempt {attempt}/{MAX_RETRIES} failed validation:")
      for err in e.errors():
        print(f"  - {' -> '.join(str(loc_part) for loc_part in err['loc'])}: {err['msg']}")

  # All retries exhausted
  raise RuntimeError(
    f"Cover letter generation failed after {MAX_RETRIES} attempts.\n"
    f"Last validation error:\n{last_error}"
  )

def write_linkedin_note(state: AgentState) -> dict[str, Any]:
  """
    Write a LinkedIn note that highlights the user's fit for the role based on the JD and user context.
  """
  _register_state_document_for_tools(state)

  job_requirements = state.jd_requirements
  user_profile = state.user_profile_structured
  system_message = SystemMessage(content=LINKEDIN_NOTE_PROMPT)
  user_message = HumanMessage(content=json.dumps({
    "jd_requirements": job_requirements,
    "candidate_resume_data": user_profile,
    "user_id": state.user_id,
    "document_id": state.doc_key,
    "document_type": state.rag_document_type or "pdf",
    "key": state.rag_key,
  }, ensure_ascii=False))
  result = llm.run(messages=[system_message, user_message], task=TaskEnum.GEN)
  print("[agent:write_linkedin_note] Raw LLM output:", result.content)
  parsed = parse_json_payload(result.content)
  if not parsed:
    raise ValueError("Failed to parse LinkedIn note output as JSON.")
  if isinstance(parsed, dict) and "linkedin_note" in parsed:
      parsed = parsed["linkedin_note"]
  if isinstance(parsed, dict) and "note" in parsed and "character_count" in parsed:
    note = parsed["note"]
    if isinstance(note, str):
      actual_count = len(note)
      if parsed["character_count"] != actual_count:
        parsed["character_count"] = actual_count
  linkedin_note = LinkedInNoteContent.model_validate(parsed)
  return {
    "linkedin_note": linkedin_note,
  }

def write_cold_mail(state: AgentState) -> dict[str, Any]:
  """
    Write a cold mail that highlights the user's fit for the role based on the JD and user context.
  """

  _register_state_document_for_tools(state)

  job_requirements = state.jd_requirements
  user_profile = state.user_profile_structured or empty_user_profile_structured()
  system_message = SystemMessage(content=COLD_MAIL_PROMPT)
  system_context_message = SystemMessage(content=json.dumps({
    "jd_requirements": job_requirements,
    "candidate_resume_data": user_profile,
    "user_id": state.user_id,
    "document_id": state.doc_key,
    "document_type": state.rag_document_type or "pdf",
    "key": state.rag_key,
  }, ensure_ascii=False))
  user_message = HumanMessage(content=state.user_query)
  result = llm.run(messages=[system_message, system_context_message, user_message], task=TaskEnum.GEN)
  return {
    "cold_mail": _coerce_cold_mail_output(result.content)
  }

def output(state: AgentState) -> dict[str, Any]:
  if state.action == ActionEnum.REVIEW:
    print("[Agent:output] Preparing output for REVIEW action with state:", state.role_fit)
    return {
      "generated_output": ReviewNodeOutput(
        type=state.action,
        what_is_job=state.job_profile or "",
        search_company=state.company_info or {},
        role_fit=state.role_fit or RoleFitOutput(),
      )
    }
  elif state.action == ActionEnum.GENERATE_APPLY_NOTE:
    return {
      "generated_output": ApplyNodeOutput(
        type=state.action,
        application_note=state.application_note or "",
      )
    }
  elif state.action == ActionEnum.GENERATE_COVER_LETTER:
    return {
      "generated_output": CoverLetterNodeOutput(
        type=state.action,
        cover_letter=state.cover_letter or CoverLetterContent(header=CoverLetterHeader(candidate_name="", company_name="", date="", email="", github_url=None, linkedin_url=None, phone="", role_title=""), body=CoverLetterBody(paragraph_1_hook="", paragraph_2_proof="", paragraph_3_company_fit="", paragraph_4_complete_picture="", paragraph_5_cta=""), sign_off=CoverLetterSignOff(closing="", candidate_name=""))
      )
    }
  elif state.action == ActionEnum.GENERATE_LINKEDIN_NOTE:
    return {
      "generated_output":  LinkedInNoteNodeOutput(
        type=state.action,
        linkedin_note=state.linkedin_note or LinkedInNoteContent(note="", candidate_name="", company_name="",character_count=0, role_title="", hook=""),
      )
    }
  else:
    return { 
      "generated_output": ColdMailNodeOutput(
        type=state.action,
        cold_mail=state.cold_mail or ColdMail(subject="", email_body=""),
      )
    }