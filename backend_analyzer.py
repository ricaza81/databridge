"""
DataBridge · Motor de análisis de fuentes de datos
Detecta estructura, relaciones y calidad sin ninguna suposición previa.
"""

import pandas as pd
import numpy as np
import re
import json
from pathlib import Path
from typing import Any


# ─── Lectura universal ────────────────────────────────────────────────────────

def read_source(path: str) -> dict[str, pd.DataFrame]:
    """Lee cualquier archivo soportado y devuelve {hoja: DataFrame}."""
    p = Path(path)
    ext = p.suffix.lower()

    if ext in (".xlsx", ".xlsm"):
        wb = pd.ExcelFile(path, engine="openpyxl")
        sheets = {}
        for name in wb.sheet_names:
            try:
                df = pd.read_excel(path, sheet_name=name, engine="openpyxl")
                # Descartar hojas completamente vacías
                df = df.dropna(how="all").dropna(axis=1, how="all")
                if not df.empty and len(df) > 1:
                    sheets[name] = df
            except Exception:
                pass
        return sheets

    if ext == ".xls":
        df = pd.read_excel(path, engine="xlrd")
        return {"Hoja1": df}

    if ext == ".csv":
        for enc in ("utf-8", "latin-1", "cp1252"):
            try:
                df = pd.read_csv(path, encoding=enc)
                return {"data": df}
            except Exception:
                continue

    raise ValueError(f"Formato no soportado: {ext}")


# ─── Perfil de una columna ────────────────────────────────────────────────────

def profile_column(series: pd.Series) -> dict:
    total = len(series)
    nulls = int(series.isna().sum())
    non_null = series.dropna()
    unique = int(non_null.nunique())
    sample = [str(v) for v in non_null.head(5).tolist()]

    dtype_str = str(series.dtype)
    inferred = "text"
    if pd.api.types.is_numeric_dtype(series):
        inferred = "numeric"
    elif pd.api.types.is_datetime64_any_dtype(series):
        inferred = "datetime"
    else:
        # Intentar inferir fechas desde texto
        if non_null.shape[0] > 0:
            sample_val = str(non_null.iloc[0])
            if re.search(r"\d{4}[-/]\d{2}[-/]\d{2}", sample_val):
                inferred = "datetime"
            elif re.match(r"^\d{6,12}$", sample_val.replace(".", "")):
                inferred = "id_numeric"

    return {
        "dtype": dtype_str,
        "inferred_type": inferred,
        "total": total,
        "nulls": nulls,
        "null_pct": round(nulls / total * 100, 1) if total else 0,
        "unique": unique,
        "unique_pct": round(unique / max(total - nulls, 1) * 100, 1),
        "sample": sample,
        "is_potential_key": unique == (total - nulls) and nulls < total * 0.05,
        "is_constant": unique == 1,
    }


# ─── Perfil de un DataFrame ───────────────────────────────────────────────────

def profile_dataframe(df: pd.DataFrame, name: str) -> dict:
    columns = {}
    potential_keys = []
    date_cols = []
    id_cols = []
    name_cols = []

    for col in df.columns:
        col_str = str(col)
        p = profile_column(df[col])
        columns[col_str] = p

        if p["is_potential_key"]:
            potential_keys.append(col_str)
        if p["inferred_type"] in ("datetime",):
            date_cols.append(col_str)
        if p["inferred_type"] in ("id_numeric", "numeric") and any(
            kw in col_str.lower() for kw in ["id", "doc", "cedula", "nro", "refer", "pedido", "codigo", "serial", "chasis", "vin"]
        ):
            id_cols.append(col_str)
        if any(kw in col_str.lower() for kw in ["nombre", "name", "cliente", "vendedor", "asesor", "customer"]):
            name_cols.append(col_str)

    return {
        "source_name": name,
        "rows": len(df),
        "cols": len(df.columns),
        "columns": columns,
        "potential_keys": potential_keys,
        "date_columns": date_cols,
        "id_columns": id_cols,
        "name_columns": name_cols,
    }


# ─── Detección de relaciones entre DataFrames ─────────────────────────────────

def _normalize_series(s: pd.Series) -> pd.Series:
    """Normaliza una serie para comparación: string, uppercase, strip."""
    return s.dropna().astype(str).str.strip().str.upper()


def detect_relationships(profiles: list[dict], dfs: dict[str, pd.DataFrame]) -> list[dict]:
    """Compara columnas entre todas las fuentes y detecta posibles joins."""
    relationships = []
    sources = list(dfs.keys())

    for i in range(len(sources)):
        for j in range(i + 1, len(sources)):
            src_a, src_b = sources[i], sources[j]
            df_a, df_b = dfs[src_a], dfs[src_b]

            for col_a in df_a.columns:
                for col_b in df_b.columns:
                    col_a_str, col_b_str = str(col_a), str(col_b)

                    # Candidatos por similitud de nombre de columna
                    name_sim = _col_name_similarity(col_a_str, col_b_str)
                    if name_sim < 0.4:
                        continue

                    # Calcular intersección de valores
                    vals_a = _normalize_series(df_a[col_a])
                    vals_b = _normalize_series(df_b[col_b])

                    if len(vals_a) == 0 or len(vals_b) == 0:
                        continue

                    set_a = set(vals_a)
                    set_b = set(vals_b)
                    intersection = set_a & set_b

                    if len(intersection) < 2:
                        continue

                    coverage_a = round(len(intersection) / len(set_a) * 100, 1)
                    coverage_b = round(len(intersection) / len(set_b) * 100, 1)
                    min_coverage = min(coverage_a, coverage_b)

                    if min_coverage < 10:
                        continue

                    relationships.append({
                        "source_a": src_a,
                        "col_a": col_a_str,
                        "source_b": src_b,
                        "col_b": col_b_str,
                        "name_similarity": round(name_sim, 2),
                        "shared_values": len(intersection),
                        "coverage_a_pct": coverage_a,
                        "coverage_b_pct": coverage_b,
                        "min_coverage_pct": min_coverage,
                        "sample_shared": list(intersection)[:5],
                        "confidence": _relationship_confidence(name_sim, min_coverage, col_a_str, col_b_str),
                    })

    # Ordenar por confianza descendente
    relationships.sort(key=lambda x: x["confidence"], reverse=True)
    return relationships


def _col_name_similarity(a: str, b: str) -> float:
    """Similitud simple entre nombres de columna — keywords comunes."""
    a_lower = a.lower().replace("_", " ").replace(".", " ")
    b_lower = b.lower().replace("_", " ").replace(".", " ")

    # Mismo nombre exacto
    if a_lower.strip() == b_lower.strip():
        return 1.0

    # Keywords semánticos con sus alias
    keyword_groups = [
        ["pedido", "refer", "referencia", "orden", "order"],
        ["serie", "serial", "nro", "numero", "number"],
        ["placa", "plate", "matricula", "licencia"],
        ["chasis", "vin", "bastidor", "chassis"],
        ["vendedor", "asesor", "vendor", "seller", "sales"],
        ["cliente", "customer", "client", "comprador", "oportunidad"],
        ["modelo", "vehiculo", "producto", "vehicle", "model", "familia"],
        ["fecha", "date", "dia", "day", "apertura", "factura", "cierre"],
        ["con", "concesionario", "sede", "sucursal", "branch"],
        ["cedula", "doc", "documento", "dni", "id"],
        ["color", "colour"],
        ["ciudad", "city", "municipio"],
    ]

    for group in keyword_groups:
        a_in = any(kw in a_lower for kw in group)
        b_in = any(kw in b_lower for kw in group)
        if a_in and b_in:
            return 0.8

    # Tokens comunes
    tokens_a = set(re.findall(r"[a-z]+", a_lower))
    tokens_b = set(re.findall(r"[a-z]+", b_lower))
    tokens_a = {t for t in tokens_a if len(t) > 2}
    tokens_b = {t for t in tokens_b if len(t) > 2}

    if not tokens_a or not tokens_b:
        return 0.0

    common = tokens_a & tokens_b
    return len(common) / max(len(tokens_a), len(tokens_b))


def _relationship_confidence(name_sim: float, coverage: float, col_a: str, col_b: str) -> float:
    """Score 0-100 de confianza en la relación."""
    score = (name_sim * 40) + (coverage / 100 * 40)

    # Bonus por keywords fuertes de llaves
    strong_keys = ["pedido", "refer", "serie", "chasis", "vin", "placa", "cedula", "doc"]
    col_a_l = col_a.lower()
    col_b_l = col_b.lower()
    for kw in strong_keys:
        if kw in col_a_l and kw in col_b_l:
            score += 20
            break

    return round(min(score, 100), 1)


# ─── Análisis de calidad ──────────────────────────────────────────────────────

def quality_issues(profiles: list[dict]) -> list[dict]:
    issues = []
    for p in profiles:
        for col, cp in p["columns"].items():
            if cp["null_pct"] > 30:
                severity = "alta" if cp["null_pct"] > 60 else "media"
                issues.append({
                    "source": p["source_name"],
                    "column": col,
                    "type": "nulos_excesivos",
                    "detail": f"{cp['null_pct']}% de valores nulos",
                    "severity": severity,
                })
            if cp["is_constant"] and cp["total"] > 10:
                issues.append({
                    "source": p["source_name"],
                    "column": col,
                    "type": "columna_constante",
                    "detail": f"Valor único: {cp['sample'][0] if cp['sample'] else 'N/A'}",
                    "severity": "baja",
                })
    return issues


# ─── Serialización segura para JSON ──────────────────────────────────────────

class SafeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (np.integer,)):
            return int(obj)
        if isinstance(obj, (np.floating,)):
            return float(obj)
        if isinstance(obj, (np.ndarray,)):
            return obj.tolist()
        if isinstance(obj, pd.Timestamp):
            return str(obj)
        return super().default(obj)


# ─── Entry point ──────────────────────────────────────────────────────────────

def analyze_files(file_paths: list[str]) -> dict:
    """
    Analiza múltiples archivos y devuelve un diagnóstico completo.
    Este diccionario se convierte en contexto para el agente Claude.
    """
    all_dfs: dict[str, pd.DataFrame] = {}
    all_profiles: list[dict] = []
    errors: list[str] = []

    for path in file_paths:
        fname = Path(path).name
        try:
            sheets = read_source(path)
            for sheet_name, df in sheets.items():
                key = f"{fname} · {sheet_name}" if len(sheets) > 1 else fname
                # Para archivos multi-hoja, tomar la hoja con más datos como principal
                all_dfs[key] = df
                profile = profile_dataframe(df, key)
                all_profiles.append(profile)
        except Exception as e:
            errors.append(f"{fname}: {str(e)}")

    relationships = detect_relationships(all_profiles, all_dfs)
    issues = quality_issues(all_profiles)

    return {
        "sources": [
            {
                "name": p["source_name"],
                "rows": p["rows"],
                "cols": p["cols"],
                "potential_keys": p["potential_keys"],
                "date_columns": p["date_columns"],
                "id_columns": p["id_columns"],
                "name_columns": p["name_columns"],
                "column_summary": {
                    col: {
                        "type": cp["inferred_type"],
                        "null_pct": cp["null_pct"],
                        "unique_pct": cp["unique_pct"],
                        "is_potential_key": cp["is_potential_key"],
                        "sample": cp["sample"][:3],
                    }
                    for col, cp in p["columns"].items()
                },
            }
            for p in all_profiles
        ],
        "relationships": relationships[:20],  # top 20
        "quality_issues": issues[:30],
        "errors": errors,
        "summary": {
            "total_sources": len(all_profiles),
            "total_rows": sum(p["rows"] for p in all_profiles),
            "total_relationships_found": len(relationships),
            "high_confidence_relationships": len([r for r in relationships if r["confidence"] >= 70]),
            "critical_quality_issues": len([i for i in issues if i["severity"] == "alta"]),
        },
    }
