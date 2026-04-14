from collections.abc import Iterator
from typing import Any

from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel

from app.schema.state import AgentState
from .nodes import (
	compare_user_skills_to_jd,
	router,
	route_after_jd,
	what_is_job,
	ensure_jd,
	gen_router,
	search_about_company,
	get_user_context,
	route_generation,
	write_cold_mail,
	write_cover_letter,
	write_linkedin_note,
	output,
)


def build_workflow():
	graph = StateGraph(AgentState)

	# router note
	graph.add_node("router",router)
	graph.add_node("gen_router", gen_router)
	graph.add_node("ensure_jd", ensure_jd) 
	graph.add_node("review", lambda state:state)

	# enrichment nodes
	graph.add_node("what_is_job", what_is_job)
	graph.add_node("user_context", get_user_context)
	graph.add_node("search_company", search_about_company)

	# analysis node
	graph.add_node("compare_user_skills_to_jd", compare_user_skills_to_jd)

	# generation nodes
	graph.add_node("gen_cover_letter", write_cover_letter)
	graph.add_node("gen_cold_mail", write_cold_mail)
	graph.add_node("gen_linkedin_note", write_linkedin_note)

	# output node
	graph.add_node("output", output)

	# edges
	graph.add_edge(START, "router")
	graph.add_edge("router", "ensure_jd")

	graph.add_conditional_edges(
		"ensure_jd",
		route_after_jd,
		{
			"review_flow": "review",
			"generation_flow": "gen_router"
		}
	)

	graph.add_edge("review",  "what_is_job")
	graph.add_edge("review",  "user_context")
	graph.add_edge("review",  "search_company")
	graph.add_edge(["what_is_job", "user_context", "search_company"], "compare_user_skills_to_jd")
	graph.add_edge("compare_user_skills_to_jd", "output")

	graph.add_conditional_edges(
		"gen_router",
		route_generation,
		{
			"cover_letter": "gen_cover_letter",
			"cold_mail": "gen_cold_mail",
			"linkedin_note": "gen_linkedin_note",
		},
	)

	graph.add_edge("gen_cover_letter", "output")
	graph.add_edge("gen_cold_mail", "output")
	graph.add_edge("gen_linkedin_note", "output")

	graph.add_edge("output", END)

	return graph.compile()


def run_workflow(input_state: AgentState | dict):
	state = input_state if isinstance(input_state, AgentState) else AgentState.model_validate(input_state)
	workflow = build_workflow()
	result = workflow.invoke(state)
	result = AgentState.model_validate(result)
	return result.generated_output


def _to_serializable_payload(value: Any) -> Any:
	if isinstance(value, BaseModel):
		return value.model_dump()
	return value


def run_workflow_stream(input_state: AgentState | dict) -> Iterator[dict[str, Any]]:
	state = input_state if isinstance(input_state, AgentState) else AgentState.model_validate(input_state)
	workflow = build_workflow()

	for event in workflow.stream(state, stream_mode="updates"):
		if not isinstance(event, dict):
			continue

		for node_name, node_update in event.items():
			payload: dict[str, Any] = {
				"event": "node_completed",
				"node": node_name,
			}

			if isinstance(node_update, BaseModel):
				generated_output = getattr(node_update, "generated_output", None)
			elif isinstance(node_update, dict):
				generated_output = node_update.get("generated_output")
			else:
				generated_output = None

			if generated_output is not None:
				payload["event"] = "final_output"
				payload["data"] = _to_serializable_payload(generated_output)

			yield payload
