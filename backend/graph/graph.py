from langgraph.graph import END, StateGraph

from backend.graph.nodes import rank_and_explain, retrieve_memory, update_memory
from backend.graph.state import DealScoutState


def build_search_graph():
    graph = StateGraph(DealScoutState)
    graph.add_node("retrieve_memory", retrieve_memory)
    graph.add_node("rank_and_explain", rank_and_explain)
    graph.set_entry_point("retrieve_memory")
    graph.add_edge("retrieve_memory", "rank_and_explain")
    graph.add_edge("rank_and_explain", END)
    return graph.compile()


def build_feedback_graph():
    graph = StateGraph(DealScoutState)
    graph.add_node("update_memory", update_memory)
    graph.set_entry_point("update_memory")
    graph.add_edge("update_memory", END)
    return graph.compile()


search_graph = build_search_graph()
feedback_graph = build_feedback_graph()
