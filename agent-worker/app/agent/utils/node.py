import ast
import json
import re
from typing import Any


def _slice_section(text: str, start_marker: str, end_markers: list[str]) -> str:
  lower_text = text.lower()
  start_idx = lower_text.find(start_marker.lower())
  if start_idx == -1:
    return ""

  section_start = start_idx + len(start_marker)
  section_end = len(text)
  for marker in end_markers:
    marker_idx = lower_text.find(marker.lower(), section_start)
    if marker_idx != -1 and marker_idx < section_end:
      section_end = marker_idx

  return text[section_start:section_end].strip()


def _normalize_lines(chunks: list[str]) -> list[str]:
  lines: list[str] = []
  for chunk in chunks:
    for raw_line in chunk.splitlines():
      cleaned_line = re.sub(r"[\uf000-\uf8ff]", "", raw_line).strip()
      if cleaned_line:
        lines.append(cleaned_line)
  return lines


def coerce_message_content(content: Any) -> str:
  if isinstance(content, str):
    return content
  if isinstance(content, list):
    parts: list[str] = []
    for item in content:
      if isinstance(item, str):
        parts.append(item)
      elif isinstance(item, dict):
        text = item.get("text")
        if isinstance(text, str):
          parts.append(text)
      else:
        parts.append(str(item))
    return "\n".join(parts)
  if content is None:
    return ""
  return str(content)


def parse_json_payload(content: Any) -> dict | None:
	if isinstance(content, dict):
		return content

	text = coerce_message_content(content).strip()
	if not text:
		return None

	try:
		parsed = json.loads(text)
		if isinstance(parsed, dict):
			return parsed
	except Exception:
		pass

	fenced_match = re.search(
		r"```(?:json)?\s*([\s\S]*?)\s*```",
		text,
		flags=re.DOTALL | re.IGNORECASE,
	)
	if fenced_match:
		fenced_text = fenced_match.group(1).strip()
		try:
			parsed = json.loads(fenced_text)
			if isinstance(parsed, dict):
				return parsed
		except Exception:
			pass
		fixed = fenced_text.replace("'", '"')
		fixed = re.sub(r',\s*([}\]])', r'\1', fixed)
		try:
			parsed = json.loads(fixed)
			if isinstance(parsed, dict):
				return parsed
		except Exception:
			pass

	json_match = re.search(r'(\{[\s\S]*\})', text)
	if json_match:
		json_text = json_match.group(1)
		try:
			parsed = json.loads(json_text)
			if isinstance(parsed, dict):
				return parsed
		except Exception:
			pass
		fixed = json_text.replace("'", '"')
		fixed = re.sub(r',\s*([}\]])', r'\1', fixed)
		try:
			parsed = json.loads(fixed)
			if isinstance(parsed, dict):
				return parsed
		except Exception:
			pass

	try:
		py_obj = ast.literal_eval(text)
		if isinstance(py_obj, dict):
			return json.loads(json.dumps(py_obj))
	except Exception:
		pass

	return None


def extract_jd_requirements_fallback(jd_text: str) -> dict:
  def _section_items(section_text: str) -> list[str]:
    items: list[str] = []
    for line in section_text.splitlines():
      cleaned = line.strip().lstrip("•-").strip()
      if not cleaned:
        continue
      if cleaned.endswith(":"):
        continue
      if cleaned not in items:
        items.append(cleaned)
    return items

  lower_text = jd_text.lower()
  role_match = re.search(r"as a\s+([^.,\n]+)", jd_text, flags=re.IGNORECASE)
  role_title = role_match.group(1).strip() if role_match else None

  seniority_level = None
  for level in ["junior", "mid", "senior", "lead", "principal", "staff", "intern"]:
    if level in lower_text:
      seniority_level = level
      break

  required_section = _slice_section(
    jd_text,
    "Required Skills & Qualifications:",
    ["Preferred Qualifications:", "Ready to Launch", "Role Overview"],
  )
  preferred_section = _slice_section(
    jd_text,
    "Preferred Qualifications:",
    ["Ready to Launch", "Role Overview"],
  )
  responsibilities_section = _slice_section(
    jd_text,
    "Key Responsibilities:",
    ["Required Skills & Qualifications:", "Preferred Qualifications:", "Role Overview"],
  )

  required_items = _section_items(required_section)
  preferred_items = _section_items(preferred_section)
  responsibilities = _section_items(responsibilities_section)

  exp_match = re.search(r"(\d+\s*[-+]\s*\d*\s*years|\d+\+?\s*years)", jd_text, flags=re.IGNORECASE)
  experience_years = exp_match.group(1).strip() if exp_match else None

  technologies: list[str] = []
  tech_keywords = [
    "python", "java", "rest", "api", "git", "sql", "nosql", "cloud", "agile", "algorithms", "data structures",
  ]
  for keyword in tech_keywords:
    if keyword in lower_text and keyword not in technologies:
      technologies.append(keyword)

  soft_skills: list[str] = []
  for skill in ["communication", "teamwork", "problem-solving", "learning", "collaborative"]:
    if skill in lower_text and skill not in soft_skills:
      soft_skills.append(skill)

  domain_or_industry = None
  if "technology consulting" in lower_text:
    domain_or_industry = "technology consulting"
  elif "product development" in lower_text:
    domain_or_industry = "product development"

  return {
    "role_title": role_title,
    "seniority_level": seniority_level,
    "required_skills": required_items,
    "preferred_skills": preferred_items,
    "responsibilities": responsibilities,
    "technologies": technologies,
    "domain_or_industry": domain_or_industry,
    "experience_years": experience_years,
    "soft_skills": soft_skills,
  }


def extract_profile_from_chunks(chunks: list[str]) -> dict:
  if not chunks:
    return {
      "name": None,
      "email": None,
      "location": None,
      "summary": None,
      "technical_skills": [],
      "experience": [],
      "education": [],
      "links": {},
    }

  combined_text = "\n".join(chunks)
  lines = _normalize_lines(chunks)

  email_match = re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", combined_text)
  email = email_match.group(0) if email_match else None

  email_idx = None
  if email:
    for idx, line in enumerate(lines):
      if email in line:
        email_idx = idx
        break

  name = None
  name_regex = re.compile(r"^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$")
  if email_idx is not None:
    for idx in range(max(0, email_idx - 3), email_idx):
      candidate = lines[idx]
      if name_regex.match(candidate):
        name = candidate
        break

  if not name:
    for candidate in lines[:20]:
      if name_regex.match(candidate):
        name = candidate
        break

  location = None
  location_regex = re.compile(r"^[A-Za-z .'-]+,\s*[A-Za-z .'-]+$")
  search_range = lines[max(0, (email_idx or 0) - 3):(email_idx or len(lines)) + 3] if email_idx is not None else lines[:20]
  for candidate in search_range:
    if location_regex.match(candidate) and ":" not in candidate:
      location = candidate
      break

  text_lines = "\n".join(lines)
  summary = _slice_section(
    text_lines,
    "Summary",
    ["Experience", "Technical Skills", "Education", "Achievements"],
  )

  skills_section = _slice_section(
    text_lines,
    "Technical Skills",
    ["Achievements", "Education", "Experience"],
  )
  technical_skills = [
    line.lstrip("•-").strip()
    for line in skills_section.splitlines()
    if line.strip().startswith("•") or (":" in line and not line.lower().startswith("summary"))
  ]
  technical_skills = [skill for skill in technical_skills if len(skill) > 3][:12]

  experience = []
  for line in lines:
    if "|" in line and any(word in line.lower() for word in ["engineer", "developer", "intern", "lead"]):
      if line not in experience:
        experience.append(line)

  education = []
  education_keywords = ("bachelor", "master", "college", "university", "graduation", "engineering", "school")
  for line in lines:
    lower_line = line.lower()
    if line.startswith("•"):
      continue
    if any(keyword in lower_line for keyword in education_keywords):
      if ":" in line and "graduation" not in lower_line:
        continue
      if line not in education:
        education.append(line)
  education = education[:5]

  linkedin = None
  github = None
  x_handle = None
  reserved_tokens = {"summary", "education", "experience", "technical", "skills", "achievements"}
  for line in lines:
    lower_line = line.lower()
    if "linkedin.com/" in lower_line and linkedin is None:
      linkedin = line
      continue
    if "github.com/" in lower_line and github is None:
      github = line
      continue
    if line.startswith("@") and x_handle is None:
      x_handle = line
      continue
    if re.fullmatch(r"[A-Za-z0-9_-]{3,}", line):
      if lower_line in reserved_tokens:
        continue
      if "-" in line and linkedin is None:
        linkedin = line
      elif github is None and re.match(r"^(?=.*[a-z])(?=.*[A-Z])[A-Za-z0-9_-]{3,}$", line):
        github = line

  return {
    "name": name,
    "email": email,
    "location": location,
    "summary": summary or None,
    "technical_skills": technical_skills,
    "experience": experience,
    "education": education,
    "links": {
      "linkedin": linkedin,
      "github": github,
      "x": x_handle,
    },
  }
