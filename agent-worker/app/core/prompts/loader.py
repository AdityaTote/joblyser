import os
from pathlib import Path

class Prompt:

  def __init__(self):
    env_prompt_dir = os.getenv("PROMPTS_DIR")
    candidates: list[Path] = []
    if env_prompt_dir:
      candidates.append(Path(env_prompt_dir).expanduser().resolve())
    candidates.append((Path(__file__).resolve().parents[3] / "data" / "prompts").resolve())
    candidates.append((Path.cwd() / "data" / "prompts").resolve())
    self._path = next((path for path in candidates if path.exists()), candidates[0])
    # Debug print to check resolved prompt path
    print(f"[Prompt Loader] Using prompt directory: {self._path}")

    self._jd_extractor_path = self._path / "extract_jd_requirements_prompt.txt"
    self._vector_query_path = self._path / "vector_query_prompt.txt"
    self._search_company_path = self._path / "search_company_prompt.txt"
    self._job_profile_path = self._path / "job_profile_prompt.txt"
    self._compare_user_skills_to_jd_path = self._path / "compare_user_skills_to_jd_prompt.txt"
    self._cover_letter_path = self._path / "cover_letter_prompt.txt"
    self._linkedin_note_path = self._path / "linkedin_note_prompt.txt"
    self._cold_mail_path = self._path / "cold_mail_prompt.txt"

  def _resolve_first_existing_path(self, *filenames: str) -> Path:
    for filename in filenames:
      path = self._path / filename
      if path.exists():
        return path
    return self._path / filenames[0]

  def _read_or_default(self, path: Path) -> str:
    if path and path.exists():
      return path.read_text(encoding="utf-8")
    return ""

  def jd_extractor(self) -> str:
    return self._read_or_default(self._jd_extractor_path)
  
  def vector_query(self) -> str:
    return self._read_or_default(self._vector_query_path)
  
  def search_company(self) -> str:
    return self._read_or_default(self._search_company_path)
  def job_profile(self) -> str:
    return self._read_or_default(self._job_profile_path)

  def compare_user_skills_to_jd(self) -> str:
    return self._read_or_default(self._compare_user_skills_to_jd_path)

  def cover_letter(self) -> str:
    return self._read_or_default(self._cover_letter_path)

  def linkedin_note(self) -> str:
    return self._read_or_default(self._linkedin_note_path)
  
  def cold_mail(self) -> str:
    return self._read_or_default(self._cold_mail_path)

prompt = Prompt()

JD_EXTRACTOR_PROMPT = prompt.jd_extractor()
USER_CONTEXT_PROMPT = prompt.vector_query()
SEARCH_COMPANY_PROMPT = prompt.search_company()
JOB_PROFILE_PROMPT = prompt.job_profile()
COMPARE_USER_SKILLS_TO_JD_PROMPT = prompt.compare_user_skills_to_jd()
COVER_LETTER_PROMPT = prompt.cover_letter()
LINKEDIN_NOTE_PROMPT = prompt.linkedin_note()
COLD_MAIL_PROMPT = prompt.cold_mail()