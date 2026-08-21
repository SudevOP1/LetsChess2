from .bot1 import bot1_predict, bot1_eval

BOTS: dict[str, dict] = {
    "bot1": {
        "id": "bot1",
        "name": "Bot1",
        "elo": 1200,
        "depth": 4,
        "predict": bot1_predict,
        "evaluate": bot1_eval,
    },
}


def get_bot(bot_id: str) -> dict | None:
    return BOTS.get(bot_id)
