from fastapi import APIRouter
from pydantic import BaseModel, Field

from backend.services.ai_assistant import answer_question

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])


class AskRequest(BaseModel):
    prompt: str = Field(min_length=2, max_length=400)


@router.post("/ask")
def ask_ai(request: AskRequest) -> dict[str, object]:
    result = answer_question(request.prompt)
    return {"prompt": request.prompt, **result}
