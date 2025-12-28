from redis import Redis
from typing import Callable, Union

redis_client : Redis = Redis(host='redis', port=6379)

from typing import Callable, Union, Literal

def get_with_fallback(
    name: str,
    key: str,
    datatype: Literal["str", "int"],
    fallback: Callable[[str], Union[str, int]],
) -> Union[str, int]:
    value = redis_client.hget(name, key)

    if value is None:
        data = fallback(key)

        # heal Redis
        redis_client.hset(name, key, data)

        return data

    if datatype == "str":
        return value.decode("utf-8")

    return int(value)


def set_redis_data(
    name: str, key: str, value: str | int
) -> None:
    """Set a given key-value pair in Redis"""
    redis_client.hset(name, key, value)


def increment_redis_data(
    name: str, key: str, amount: int = 1
) -> None:
    """Increment a given key's value in Redis by a specified amount"""
    redis_client.hincrby(name, key, amount)