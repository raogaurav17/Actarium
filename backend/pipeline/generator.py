from __future__ import annotations

import logging


from langchain_core.documents import Document
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnablePassthrough, RunnableParallel, RunnableLambda
from langchain_google_genai import ChatGoogleGenerativeAI

from config import get_settings

logger = logging.getLogger(__name__)



def _get_llm(temperature: float = 0.3) -> ChatGoogleGenerativeAI:
    settings = get_settings()
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=settings.gemini_api_key,
        temperature=temperature,
        convert_system_message_to_human=True,
    )


def build_rag_chain(retriever):
    # Basic RAG chain without sources
    prompt = ChatPromptTemplate.from_messages([
        ("system", (
            "You are Actarium Legal Assistant helping Indian citizens understand their legal rights.\n\n"
            "Rules:\n"
            "1. Answer only from the provided context\n"
            "2. If not in context, say: 'I don't have enough information. Please consult a lawyer.'\n"
            "3. Simple language, cite section numbers where available\n"
            "4. Under 200 words\n\n"
            "Context:\n{context}"
        )),
        MessagesPlaceholder(variable_name="chat_history", optional=True),
        ("human", "{question}"),
    ])

    def _format_docs(docs: list[Document]) -> str:
        return "\n\n---\n\n".join(
            f"[{doc.metadata.get('source', 'Legal Document')}]\n{doc.page_content}"
            for doc in docs
        )

    chain = (
        {
            "context": retriever | _format_docs,
            "question": RunnablePassthrough(),
            "chat_history": lambda _: [],
        }
        | prompt
        | _get_llm()
        | StrOutputParser()
    )
    return chain


def build_rag_chain_with_sources(retriever):
    # RAG chain returning answer and context
    prompt = ChatPromptTemplate.from_messages([
        ("system", (
            "You are Actarium Legal Assistant helping Indian citizens understand their legal rights.\n\n"
            "Rules:\n"
            "1. Answer only from the provided context\n"
            "2. If not in context, say you don't have enough information\n"
            "3. Simple language, cite section numbers where available\n"
            "4. Under 200 words\n\n"
            "Context:\n{context}"
        )),
        MessagesPlaceholder(variable_name="chat_history", optional=True),
        ("human", "{input}"),
    ])

    def _format_docs(docs: list[Document]) -> str:
        return "\n\n---\n\n".join(
            f"[{doc.metadata.get('source', 'Legal Document')}]\n{doc.page_content}"
            for doc in docs
        )

    retrieve_step = RunnableParallel(
        context=retriever,
        input=RunnablePassthrough() | RunnableLambda(
            lambda x: x.get("input", "") if isinstance(x, dict) else x
        ),
        chat_history=RunnableLambda(
            lambda x: x.get("chat_history", []) if isinstance(x, dict) else []
        ),
    )

    def _build_prompt_input(retrieved: dict) -> dict:
        return {
            "context": _format_docs(retrieved["context"]),
            "input": retrieved["input"],
            "chat_history": retrieved.get("chat_history", []),
        }

    answer_step = RunnableParallel(
        answer=RunnableLambda(_build_prompt_input) | prompt | _get_llm() | StrOutputParser(),
        context=RunnableLambda(lambda x: x["context"]),
    )

    return retrieve_step | answer_step
