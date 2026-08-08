import uuid
import razorpay
from typing import Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from app.config import get_razorpay_key_id, get_razorpay_key_secret

router = APIRouter(prefix="/api", tags=["Payment"])


class CreateOrderRequest(BaseModel):
    amount: int = Field(default=50000, description="Amount in paise (e.g. 50000 = ₹500)")
    currency: str = Field(default="INR")
    receipt: Optional[str] = None


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


@router.post("/create-order")
async def create_razorpay_order(req: CreateOrderRequest):
    """
    Step 1: Create a Razorpay Order
    - Amount MUST be in paise (e.g., 50000 paise = ₹500 INR)
    - Minimum amount: 100 paise (₹1 INR)
    """
    if req.amount < 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Amount must be at least 100 paise (₹1 INR).",
        )

    key_id = get_razorpay_key_id()
    key_secret = get_razorpay_key_secret()

    if not key_id or not key_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Razorpay credentials not configured in backend environment.",
        )

    try:
        client = razorpay.Client(auth=(key_id, key_secret))
        receipt_id = req.receipt or f"rcpt_{uuid.uuid4().hex[:10]}"

        order_data = {
            "amount": req.amount,
            "currency": req.currency.upper(),
            "receipt": receipt_id,
            "payment_capture": 1,
        }

        razorpay_order = client.order.create(data=order_data)

        return {
            "status": "success",
            "order_id": razorpay_order.get("id"),
            "amount": razorpay_order.get("amount"),
            "currency": razorpay_order.get("currency"),
            "key_id": key_id,
        }
    except razorpay.errors.BadRequestError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Razorpay Bad Request: {str(err)}",
        )
    except razorpay.errors.SignatureVerificationError as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Razorpay Auth Failure: {str(err)}",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create Razorpay order: {str(exc)}",
        )


@router.post("/verify-payment")
async def verify_razorpay_payment(req: VerifyPaymentRequest):
    """
    Step 3: Verify Razorpay Payment Signature
    Uses HMAC-SHA256(order_id + '|' + payment_id, KEY_SECRET)
    """
    if not req.razorpay_order_id or not req.razorpay_payment_id or not req.razorpay_signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required payment verification fields.",
        )

    key_id = get_razorpay_key_id()
    key_secret = get_razorpay_key_secret()

    try:
        client = razorpay.Client(auth=(key_id, key_secret))
        params_dict = {
            "razorpay_order_id": req.razorpay_order_id,
            "razorpay_payment_id": req.razorpay_payment_id,
            "razorpay_signature": req.razorpay_signature,
        }

        # Verification raises SignatureVerificationError if signature does not match
        client.utility.verify_payment_signature(params_dict)

        return {
            "status": "success",
            "message": "Payment verified successfully",
            "order_id": req.razorpay_order_id,
            "payment_id": req.razorpay_payment_id,
        }
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment verification failed: Signature mismatch.",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment verification failed: {str(exc)}",
        )
