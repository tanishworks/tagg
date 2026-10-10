#!/usr/bin/env python3
"""Create a lobby, then join it as a second device using only Python's stdlib."""

import json
import os
import urllib.error
import urllib.request
import uuid

BASE_URL = os.environ.get("LOBBY_API", "http://127.0.0.1:8787").rstrip("/")


def post(path: str, payload: dict) -> dict:
    request = urllib.request.Request(
        BASE_URL + path,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        details = error.read().decode("utf-8")
        raise RuntimeError(f"Server returned HTTP {error.code}: {details}") from error


def main() -> None:
    creator = post(
        "/lobbies",
        {"name": "Lobby creator", "deviceId": str(uuid.uuid4())},
    )
    code = creator["lobbyCode"]
    print("Created lobby:")
    print(json.dumps(creator, indent=2))

    joiner = post(
        f"/lobbies/{code}/join",
        {"name": "Guest", "deviceId": str(uuid.uuid4())},
    )
    print("\nJoined the same lobby as a second device:")
    print(json.dumps(joiner, indent=2))


if __name__ == "__main__":
    main()
