"""
Diydor verifikatsiya servisi.

Imkoniyatlar:
  • Selfie verifikatsiya: yuz bor-yo'qligi + sifat/liveness darvozasi (blur, o'lcham)
    + profil rasmi bilan FACE-MATCH (OpenCV YuNet + SFace, onnx).
  • NSFW moderatsiya: /moderate (NudeNet, onnx) — yuklangan rasmlarni tekshirish.

Dizayn tamoyili: og'ir kutubxonasiz. Modellar bo'lmasa — eski Haar cascade'ga
yoki "skip" rejimiga muloyim tushadi (servis hech qachon qulamaydi).
"""
import os
from typing import Optional

import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException
from pydantic import BaseModel

app = FastAPI(title="Diydor Verification Service")

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
YUNET_PATH = os.path.join(MODELS_DIR, "face_detection_yunet.onnx")
SFACE_PATH = os.path.join(MODELS_DIR, "face_recognition_sface.onnx")

# SFace kosinus o'xshashlik chegarasi (OpenCV tavsiyasi 0.363)
MATCH_THRESHOLD = 0.36
# Blur (Laplacian variance) minimal — pastrog'i = xira/ekran surati
MIN_BLUR_VAR = 40.0
# Yuz minimal o'lchami (rasm eniga nisbatan) — juda kichik yuz = uzoq/sifatsiz
MIN_FACE_RATIO = 0.12

# ─────────── Modellarni yuklash (bo'lmasa fallback) ───────────
_yunet = None
_sface = None
try:
    if os.path.exists(YUNET_PATH):
        _yunet = cv2.FaceDetectorYN.create(YUNET_PATH, "", (320, 320), 0.7, 0.3, 5000)
    if os.path.exists(SFACE_PATH):
        _sface = cv2.FaceRecognizerSF.create(SFACE_PATH, "")
except Exception as e:  # pragma: no cover
    print(f"[verify] YuNet/SFace yuklab bo'lmadi: {e}")

# Haar fallback (YuNet bo'lmasa)
_haar = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

# NudeNet (NSFW) — bo'lmasa moderatsiya "skip"
_nude = None
try:
    from nudenet import NudeDetector  # type: ignore

    _nude = NudeDetector()
except Exception as e:  # pragma: no cover
    print(f"[verify] NudeNet yuklanmadi (moderatsiya skip): {e}")


class VerifyResult(BaseModel):
    verified: bool
    message: str
    challenge_passed: bool = False
    match_score: Optional[float] = None
    matched: Optional[bool] = None


class ModerateResult(BaseModel):
    allowed: bool
    reason: str
    nsfw_score: Optional[float] = None


# ─────────── Yordamchilar ───────────
def _decode(contents: bytes):
    arr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="Rasm noto'g'ri formatda")
    return img


def _detect_faces(img):
    """Yuzlarni qaytaradi. YuNet bo'lsa undan, aks holda Haar'dan. (boxes, rows)."""
    h, w = img.shape[:2]
    if _yunet is not None:
        _yunet.setInputSize((w, h))
        _, faces = _yunet.detect(img)
        if faces is None:
            return [], None
        boxes = [tuple(map(int, f[:4])) for f in faces]
        return boxes, faces
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    found = _haar.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80))
    return [tuple(map(int, f)) for f in found], None


def _blur_var(img) -> float:
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())


def _embedding(img, face_row):
    """SFace embedding (faqat YuNet+SFace bor bo'lsa)."""
    if _sface is None or face_row is None:
        return None
    aligned = _sface.alignCrop(img, face_row)
    return _sface.feature(aligned)


# ─────────── Endpointlar ───────────
@app.get("/health")
def health():
    return {
        "status": "ok",
        "face_match": _sface is not None,
        "detector": "yunet" if _yunet is not None else "haar",
        "nsfw": _nude is not None,
    }


@app.post("/api/verify", response_model=VerifyResult)
async def verify_selfie(
    file: UploadFile = File(...),
    reference: Optional[UploadFile] = File(None),
):
    try:
        img = _decode(await file.read())
        h, w = img.shape[:2]

        boxes, rows = _detect_faces(img)
        if len(boxes) == 0:
            return VerifyResult(verified=False, message="Yuz aniqlanmadi. Yaxshiroq yorug'likda urinib ko'ring.")
        if len(boxes) > 1:
            return VerifyResult(verified=False, message="Suratda faqat bitta yuz bo'lishi kerak")

        # Liveness/sifat darvozasi
        if _blur_var(img) < MIN_BLUR_VAR:
            return VerifyResult(verified=False, message="Surat xira yoki ekrandan olingan. Jonli surat oling.")
        fx, fy, fw, fh = boxes[0]
        if fw < w * MIN_FACE_RATIO:
            return VerifyResult(verified=False, message="Yuz juda kichik. Kameraga yaqinroq turing.")

        # Profil rasmi bilan face-match (reference berilgan va SFace bor bo'lsa)
        match_score = None
        matched = None
        if reference is not None and _sface is not None and rows is not None:
            ref_img = _decode(await reference.read())
            r_boxes, r_rows = _detect_faces(ref_img)
            if len(r_boxes) >= 1 and r_rows is not None:
                emb_selfie = _embedding(img, rows[0])
                emb_ref = _embedding(ref_img, r_rows[0])
                if emb_selfie is not None and emb_ref is not None:
                    match_score = float(_sface.match(emb_selfie, emb_ref, cv2.FaceRecognizerSF_FR_COSINE))
                    matched = match_score >= MATCH_THRESHOLD
                    if not matched:
                        return VerifyResult(
                            verified=False,
                            message="Selfie profil rasmingizga mos kelmadi. O'zingizning suratingizni oling.",
                            match_score=match_score,
                            matched=False,
                        )

        return VerifyResult(
            verified=True,
            message="Muvaffaqiyatli tasdiqlandi",
            challenge_passed=True,
            match_score=match_score,
            matched=matched,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/moderate", response_model=ModerateResult)
async def moderate(file: UploadFile = File(...)):
    """Rasm NSFW emasligini tekshiradi. NudeNet bo'lmasa — ruxsat (skip)."""
    contents = await file.read()
    if _nude is None:
        return ModerateResult(allowed=True, reason="moderation_skipped")
    try:
        import tempfile

        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=True) as tmp:
            tmp.write(contents)
            tmp.flush()
            dets = _nude.detect(tmp.name)
        BAD = {
            "FEMALE_BREAST_EXPOSED",
            "FEMALE_GENITALIA_EXPOSED",
            "MALE_GENITALIA_EXPOSED",
            "BUTTOCKS_EXPOSED",
            "ANUS_EXPOSED",
            "MALE_BREAST_EXPOSED",
        }
        worst = 0.0
        for d in dets:
            if d.get("class") in BAD:
                worst = max(worst, float(d.get("score", 0)))
        if worst >= 0.5:
            return ModerateResult(allowed=False, reason="nsfw_detected", nsfw_score=worst)
        return ModerateResult(allowed=True, reason="ok", nsfw_score=worst)
    except Exception as e:
        # Moderatsiya xato bersa — rad etmaymiz (xizmat to'xtamasin)
        print(f"[verify] moderate xato: {e}")
        return ModerateResult(allowed=True, reason="moderation_error")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
