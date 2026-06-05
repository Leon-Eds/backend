using System.Security.Claims;

namespace LeonEdBackend.Middleware
{
    /// <summary>
    /// Extracts SchoolId from JWT claims and makes it available via HttpContext.Items for tenant isolation.
    /// </summary>
    public class TenantMiddleware
    {
        private readonly RequestDelegate _next;

        public TenantMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            if (context.User.Identity?.IsAuthenticated == true)
            {
                var schoolIdClaim = context.User.FindFirst("SchoolId")?.Value;
                if (!string.IsNullOrEmpty(schoolIdClaim) && Guid.TryParse(schoolIdClaim, out var schoolId))
                {
                    context.Items["SchoolId"] = schoolId;
                }

                var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!string.IsNullOrEmpty(userIdClaim) && Guid.TryParse(userIdClaim, out var userId))
                {
                    context.Items["UserId"] = userId;
                }

                var roleClaim = context.User.FindFirst(ClaimTypes.Role)?.Value;
                if (!string.IsNullOrEmpty(roleClaim))
                {
                    context.Items["UserRole"] = roleClaim;
                }
            }

            await _next(context);
        }
    }

    public static class TenantMiddlewareExtensions
    {
        public static IApplicationBuilder UseTenantMiddleware(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<TenantMiddleware>();
        }
    }
}
