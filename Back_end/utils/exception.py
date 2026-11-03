import traceback
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from starlette import status

#开发模式下，返回详细的错误信息；生产模式下，只返回错误码
DEBUG_MODE = True

async def http_exception_handler(request: Request, exc: HTTPException):
    # 业务主动抛出的异常（比如代码里的 404, 429）
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "code": exc.status_code,
            "message": exc.detail,
            "data": None
        }
    )

async def integrity_error_handler(request: Request, exc: IntegrityError):
    # 数据库外键冲突（比如删除了会话，消息却没删干净）
    error_msg = str(exc.orig)
    if "FOREIGN KEY" in error_msg:
        detail = "数据关联冲突，无法操作"
    else:
        detail = "数据约束冲突，请检查输入"

    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "code": 400,
            "message": detail,
            "data": {"detail": error_msg} if DEBUG_MODE else None
        }
    )

async def sqlalchemy_error_handler(request: Request, exc: SQLAlchemyError):
    # 数据库崩了、断开连接
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "code": 500,
            "message": "数据库操作失败，请稍后重试",
            "data": {"traceback": traceback.format_exc()} if DEBUG_MODE else None
        }
    )

async def general_exception_handler(request: Request, exc: Exception):
    # 兜底：其他所有未捕获的错误
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "code": 500,
            "message": "服务器内部错误",
            "data": {"traceback": traceback.format_exc()} if DEBUG_MODE else None
        }
    )