from langgraph.graph import END, StateGraph

from backend.graph.nodes import classify_value, filter_and_rank, retrieve_memory, update_memory
from backend.graph.state import DealScoutState


def build_scan_graph():
    graph = StateGraph(DealScoutState)
    graph.add_node("retrieve_memory", retrieve_memory)
    graph.add_node("classify_value", classify_value)
    graph.add_node("filter_and_rank", filter_and_rank)
    graph.set_entry_point("retrieve_memory")
    graph.add_edge("retrieve_memory", "classify_value")
    graph.add_edge("classify_value", "filter_and_rank")
    graph.add_edge("filter_and_rank", END)
    return graph.compile()


def build_feedback_graph():
    graph = StateGraph(DealScoutState)
    graph.add_node("update_memory", update_memory)
    graph.set_entry_point("update_memory")
    graph.add_edge("update_memory", END)
    return graph.compile()


scan_graph = build_scan_graph()
feedback_graph = build_feedback_graph()
