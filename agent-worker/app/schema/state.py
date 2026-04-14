import re
from enum import Enum
from typing import Any, ClassVar, Literal, Optional, TypedDict, Union

from pydantic import BaseModel, Field, HttpUrl, ValidationInfo, field_validator, model_validator


def _find_banned(text: str, phrases: list[str]) -> list[str]:
	"""
	Return any banned phrases found in text using whole-phrase word-boundary
	matching. Prevents false positives from substring hits such as 'excited'
	inside 'unexcited', or 'i am eager to contribute' inside a longer, valid
	sentence that happens to contain that substring.
	"""
	lowered = text.lower()
	return [
		phrase for phrase in phrases
		if re.search(r'\b' + re.escape(phrase) + r'\b', lowered)
	]

class ActionEnum(str, Enum):
	REVIEW = "review"
	GENERATE_APPLY_NOTE = "apply_note"
	GENERATE_COVER_LETTER = "cover_letter"
	GENERATE_LINKEDIN_NOTE = "linkedin_note"
	GENERATE_COLD_MAIL = "cold_mail"


class UserDocumentRef(TypedDict, total=False):
	user_id: str
	document_id: str
	document_type: str
	key: str | None


class JDRequirements(TypedDict, total=False):
	company: str
	job_title: str
	role_title: str
	seniority_level: str
	required_skills: list[str]
	preferred_skills: list[str]
	responsibilities: list[str]
	technologies: list[str]
	domain_or_industry: str
	experience_years: str
	soft_skills: list[str]


class UserProfileStructured(TypedDict, total=False):
	summary: str | None
	skills: list[str]
	experience: list[str]
	education: list[str]
	links: dict[str, Any]


class CompanyInfo(TypedDict, total=False):
	summary: str
	industry: str
	culture: str
	products: list[str]
	opportunities: list[str]
	risks: list[str]
	references: list[str]


class UserContextPlan(TypedDict):
	needs_user_context: bool
	reason: str
	agent_query: str
	selected_document: UserDocumentRef | None


RequirementType = Literal[
	"required_skill",
	"preferred_skill",
	"technology",
	"responsibility",
	"soft_skill",
	"experience",
]
MatchStrength = Literal["exact_match", "partial_match", "inferred_match", "no_match"]
Importance = Literal["critical", "important", "optional"]
DecisionType = Literal["apply", "apply_with_gaps", "do_not_apply"]
ConfidenceType = Literal["high", "medium", "low"]


class RoleFitComparisonBreakdown(BaseModel):
	required_total: int = 0
	required_matched: int = 0
	preferred_total: int = 0
	preferred_matched: int = 0
	responsibilities_total: int = 0
	responsibilities_matched: int = 0
	soft_skills_total: int = 0
	soft_skills_matched: int = 0
	critical_gaps_count: int = 0


class MatchedRequirement(BaseModel):
	requirement: str = ""
	requirement_type: RequirementType = "required_skill"
	match_strength: MatchStrength = "exact_match"
	evidence: str = ""


class UnmatchedRequirement(BaseModel):
	requirement: str = ""
	requirement_type: RequirementType = "required_skill"
	importance: Importance = "critical"
	why_unmatched: str = ""
	action_to_close_gap: str = ""


class RoleFitOutput(BaseModel):
	role_fit_summary: str = ""
	match_score: int = 0
	decision: DecisionType = "apply_with_gaps"
	decision_conditions: list[str] = Field(default_factory=list)
	comparison_breakdown: RoleFitComparisonBreakdown = Field(default_factory=RoleFitComparisonBreakdown)
	matched_requirements: list[MatchedRequirement] = Field(default_factory=list)
	unmatched_requirements: list[UnmatchedRequirement] = Field(default_factory=list)
	all_key_requirements_considered: list[str] = Field(default_factory=list)
	must_have_gaps: list[str] = Field(default_factory=list)
	recommended_actions_before_applying: list[str] = Field(default_factory=list)
	confidence: ConfidenceType = "medium"


# output schema for review node
class ReviewNodeOutput(BaseModel):
	type: ActionEnum
	what_is_job: str
	search_company: CompanyInfo
	role_fit: RoleFitOutput


# output schema for apply node
class ApplyNodeOutput(BaseModel):
	type: ActionEnum
	application_note: str


class CoverLetterHeader(BaseModel):
	candidate_name: str
	email: str
	phone: Optional[str] = None
	github_url: Optional[HttpUrl] = None
	linkedin_url: Optional[HttpUrl] = None
	date: str
	company_name: str
	role_title: str

	@field_validator("github_url", "linkedin_url", mode="before")
	@classmethod
	def empty_string_to_none(cls, v: Optional[str]) -> Optional[str]:
		if not v or v.strip() == "":
			return None
		return v

	@field_validator("candidate_name")
	@classmethod
	def name_must_not_be_placeholder(cls, v: str) -> str:
		placeholders = ["candidate", "[your name]", "[name]", "your name"]
		if v.strip().lower() in placeholders:
			raise ValueError(
				f"candidate_name contains a placeholder value: '{v}'. "
				"Must be the actual candidate name."
			)
		return v

	@field_validator("company_name", "role_title")
	@classmethod
	def must_not_be_placeholder(cls, v: str) -> str:
		if v.strip().startswith("[") and v.strip().endswith("]"):
			raise ValueError(
				f"Field contains an unfilled placeholder: '{v}'"
			)
		return v


class CoverLetterBody(BaseModel):
	paragraph_1_hook: str
	paragraph_2_proof: str
	paragraph_3_company_fit: str
	paragraph_4_complete_picture: str
	paragraph_5_cta: str

	BANNED_ALL_PARAGRAPHS: ClassVar[list[str]] = [
		"i am writing to apply",
		"i am writing to express",
		"i am passionate about",
		"i would love to",
		"i am eager to contribute",
		"hope this finds you well",
		"strong background in",
		"innovative work",
		"innovative culture",
		"innovative team",
		"innovative company",
		"i believe my skills",
		"i am excited",
		"i am thrilled",
		"i am honored",
		"i have experience with",
		"quick learner",
		"fast learner",
		"team player",
		"detail-oriented",
	]

	BANNED_CTA_ONLY: ClassVar[list[str]] = [
		"thank you so much for your time",
		"i hope to hear from you",
		"i would love the opportunity",
		"please consider my application",
		"i am eager to discuss",
	]

	@field_validator(
		"paragraph_1_hook",
		"paragraph_2_proof",
		"paragraph_3_company_fit",
		"paragraph_4_complete_picture",
		"paragraph_5_cta",
	)
	@classmethod
	def must_not_be_empty(cls, v: str) -> str:
		if not v or len(v.strip()) < 50:
			raise ValueError(
				"Paragraph is too short (minimum 50 characters). "
				"Each paragraph must be substantive."
			)
		return v

	@field_validator(
		"paragraph_1_hook",
		"paragraph_2_proof",
		"paragraph_3_company_fit",
		"paragraph_4_complete_picture",
		"paragraph_5_cta",
	)
	@classmethod
	def check_banned_phrases(cls, v: str, info: ValidationInfo) -> str:
		banned = cls.BANNED_ALL_PARAGRAPHS.copy()
		if info.field_name == "paragraph_5_cta":
			banned += cls.BANNED_CTA_ONLY
		found = _find_banned(v, banned)
		if found:
			raise ValueError(
				f"{info.field_name} contains banned phrase(s): {found}. "
				"Rewrite required."
			)
		return v

	@property
	def full_body(self) -> str:
		return "\n\n".join([
			self.paragraph_1_hook,
			self.paragraph_2_proof,
			self.paragraph_3_company_fit,
			self.paragraph_4_complete_picture,
			self.paragraph_5_cta,
		])

	@property
	def word_count(self) -> int:
		return len(self.full_body.split())


class CoverLetterSignOff(BaseModel):
	closing: str = "Sincerely"
	candidate_name: str
	github_url: Optional[HttpUrl] = None
	linkedin_url: Optional[HttpUrl] = None

	@field_validator("github_url", "linkedin_url", mode="before")
	@classmethod
	def empty_string_to_none(cls, v: Optional[str]) -> Optional[str]:
		if not v or v.strip() == "":
			return None
		return v

	@field_validator("candidate_name")
	@classmethod
	def name_must_not_be_placeholder(cls, v: str) -> str:
		placeholders = ["candidate", "[your name]", "[name]", "your name"]
		if v.strip().lower() in placeholders:
			raise ValueError(
				f"candidate_name contains a placeholder value: '{v}'"
			)
		return v


class CoverLetterContent(BaseModel):
	header: CoverLetterHeader
	body: CoverLetterBody
	sign_off: CoverLetterSignOff

	@field_validator("body")
	@classmethod
	def validate_word_count(cls, v: CoverLetterBody) -> CoverLetterBody:
		count = v.word_count
		if count < 250:
			raise ValueError(
				f"Cover letter body is too short ({count} words). "
				"Minimum is 250 words."
			)
		if count > 400:
			raise ValueError(
				f"Cover letter body is too long ({count} words). "
				"Maximum is 400 words."
			)
		return v

	@field_validator("body")
	@classmethod
	def paragraphs_must_be_unique(cls, v: CoverLetterBody) -> CoverLetterBody:
		paragraphs = [
			v.paragraph_1_hook,
			v.paragraph_2_proof,
			v.paragraph_3_company_fit,
			v.paragraph_4_complete_picture,
			v.paragraph_5_cta,
		]
		if len(paragraphs) != len(set(paragraphs)):
			raise ValueError(
				"Duplicate paragraphs detected. "
				"Each paragraph must be unique content."
			)
		return v

	def to_plain_text(self) -> str:
		h = self.header
		s = self.sign_off
		b = self.body

		header_block = "\n".join(filter(None, [
			h.candidate_name,
			h.email,
			h.phone,
			str(h.github_url) if h.github_url else None,
			str(h.linkedin_url) if h.linkedin_url else None,
			h.date,
			"",
			h.company_name,
			h.role_title,
		]))

		sign_off_block = "\n".join(filter(None, [
			s.closing + ",",
			s.candidate_name,
			f"GitHub: {s.github_url}" if s.github_url else None,
			f"LinkedIn: {s.linkedin_url}" if s.linkedin_url else None,
		]))

		return "\n\n".join([
			header_block,
			b.full_body,
			sign_off_block,
		])


class CoverLetterNodeOutput(BaseModel):
	type: ActionEnum
	cover_letter: CoverLetterContent


class LinkedInNoteContent(BaseModel):
	recruiter_name: Optional[str] = None
	candidate_name: str
	role_title: str
	company_name: str
	hook: str
	note: str
	character_count: int

	BANNED_PHRASES: ClassVar[list[str]] = [
		"i am passionate about",
		"i would love to",
		"i am eager to",
		"strong background in",
		"i have experience with",
		"innovative company",
		"innovative team",
		"innovative work",
		"i believe i would be a great fit",
		"dear hiring manager",
		"i am writing to express",
		"quick learner",
		"team player",
		"excited",
		"thrilled",
		"honored",
	]

	@field_validator("candidate_name", "role_title", "company_name")
	@classmethod
	def must_not_be_placeholder(cls, v: str) -> str:
		if not v or (v.strip().startswith("[") and v.strip().endswith("]")):
			raise ValueError(
				f"Field contains an unfilled placeholder: '{v}'. "
				"Must be actual value."
			)
		return v

	@field_validator("candidate_name")
	@classmethod
	def name_must_not_be_generic(cls, v: str) -> str:
		generic = ["candidate", "your name", "[name]", "[your name]"]
		if v.strip().lower() in generic:
			raise ValueError(
				f"candidate_name is a placeholder: '{v}'. "
				"Must be the actual candidate name."
			)
		return v

	@field_validator("recruiter_name")
	@classmethod
	def recruiter_name_must_not_be_placeholder(cls, v: Optional[str]) -> Optional[str]:
		if v is None:
			return v
		placeholders = [
			"[recruiter name]", "[name]", "[hiring manager]",
			"hiring manager", "recruiter",
		]
		if v.strip().lower() in placeholders:
			raise ValueError(
				f"recruiter_name is a placeholder: '{v}'. "
				"Use actual name or set to null."
			)
		return v

	@field_validator("note")
	@classmethod
	def check_banned_phrases(cls, v: str) -> str:
		found = _find_banned(v, cls.BANNED_PHRASES)
		if found:
			raise ValueError(
				f"Note contains banned phrase(s): {found}. Rewrite required."
			)
		return v

	@field_validator("note")
	@classmethod
	def validate_character_limit(cls, v: str) -> str:
		count = len(v)
		if count > 300:
			raise ValueError(
				f"Note exceeds LinkedIn's 300 character limit "
				f"({count} characters). Must be 300 or fewer."
			)
		if count < 100:
			raise ValueError(
				f"Note is too short ({count} characters). "
				"Minimum is 100 characters — add a specific hook."
			)
		return v

	@field_validator("hook")
	@classmethod
	def hook_must_be_specific(cls, v: str) -> str:
		if not v or len(v.strip()) < 20:
			raise ValueError(
				f"Hook is too vague or too short: '{v}'. "
				"Must be a specific project or skill application "
				"(minimum 20 characters)."
			)
		vague_hooks = [
			"i have experience",
			"i am skilled",
			"i know",
			"i am familiar with",
		]
		lowered = v.lower()
		for phrase in vague_hooks:
			if phrase in lowered:
				raise ValueError(
					f"Hook contains a vague claim: '{phrase}'. "
					"Use a specific project or concrete achievement instead."
				)
		return v

	@field_validator("character_count")
	@classmethod
	def character_count_must_be_in_range(cls, v: int) -> int:
		if v > 300:
			raise ValueError(
				f"character_count {v} exceeds LinkedIn's 300 character limit."
			)
		if v < 100:
			raise ValueError(
				f"character_count {v} is too low. Note is too thin."
			)
		return v

	@model_validator(mode="after")
	def validate_post_init(self) -> "LinkedInNoteContent":
		actual = len(self.note)
		if actual != self.character_count:
			raise ValueError(
				f"character_count field ({self.character_count}) does not "
				f"match actual note length ({actual} characters)."
			)

		if self.company_name.lower() not in self.note.lower():
			raise ValueError(
				f"Company name '{self.company_name}' must appear in the note."
			)

		role_words = self.role_title.lower().split()
		note_lower = self.note.lower()
		if not any(word in note_lower for word in role_words if len(word) > 3):
			raise ValueError(
				f"Role title '{self.role_title}' (or key words from it) "
				"must appear in the note."
			)

		return self


class LinkedInNoteNodeOutput(BaseModel):
	type: ActionEnum
	linkedin_note: LinkedInNoteContent


class ColdMail(BaseModel):
	subject: str
	email_body: str


class ColdMailNodeOutput(BaseModel):
	type: ActionEnum
	cold_mail: ColdMail


class AgentState(BaseModel):
	# user input
	action: ActionEnum
	doc_key: str
	user_id: str
	user_query: str
	jd_text: str

	# context
	context: Optional[list[dict[Any, Any]]] = None

	# job description extraction
	jd_requirements: Optional[JDRequirements] = None
	user_profile_structured: Optional[UserProfileStructured] = None

	agent_query: Optional[str] = None
	rag_key: Optional[str] = None
	rag_document_type: Optional[str] = None

	# computed information
	# review node outputs
	job_profile: Optional[str] = None
	company_info: Optional[CompanyInfo] = None
	role_fit: Optional[RoleFitOutput] = None

	# application note node output
	application_note: Optional[str] = None

	# cover letter node output
	cover_letter: Optional[CoverLetterContent] = None

	# linkedin note node output
	linkedin_note: Optional[LinkedInNoteContent] = None

	# cold mail node output
	cold_mail: Optional[ColdMail] = None

	# generated output
	generated_output: Optional[
		Union[
			ReviewNodeOutput,
			ApplyNodeOutput,
			CoverLetterNodeOutput,
			LinkedInNoteNodeOutput,
			ColdMailNodeOutput,
		]
	] = None