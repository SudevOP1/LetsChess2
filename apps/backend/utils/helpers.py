from django.http import JsonResponse
from functools import wraps

def UnsuccessfulResponse(error):
    return JsonResponse({
        "success": False,
        "error": error,
    })

def SuccessfulResponse(**args):
    return JsonResponse({
        **args,
        "success": True,
    })

def allow_methods(methods):
    def decorator(view_func):
        @wraps(view_func)
        def wrapped(request, *args, **kwargs):
            if request.method not in methods:
                allowed_methods = ", ".join(methods)
                plural = "s" if len(methods) > 1 else ""
                return JsonResponse(f"only {allowed_methods} method{plural} allowed")
            return view_func(request, *args, **kwargs)
        return wrapped
    return decorator
