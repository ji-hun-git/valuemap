from __future__ import annotations

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "public"

router = APIRouter(prefix="/api/v1/data", tags=["data"])


@router.get("/catalog")
def data_catalog() -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for path in sorted(DATA_DIR.glob("*.json")):
        payload = json.loads(path.read_text(encoding="utf-8"))
        top_keys = list(payload.keys())
        rows.append(
            {
                "dataset": path.name,
                "keys": top_keys,
                "records": len(next((payload[key] for key in top_keys if isinstance(payload.get(key), list)), [])),
            }
        )
    return rows


@router.get("/{dataset_name}")
def data_file(dataset_name: str) -> dict[str, object]:
    path = (DATA_DIR / dataset_name).resolve()
    if DATA_DIR not in path.parents and path != DATA_DIR:
        raise HTTPException(status_code=400, detail="Invalid dataset path")
    if not path.exists() or path.suffix != ".json":
        raise HTTPException(status_code=404, detail="Dataset not found")
    return json.loads(path.read_text(encoding="utf-8"))
