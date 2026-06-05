using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace LeonEdBackend.Controllers
{
    [ApiController]
    public abstract class BaseController : ControllerBase
    {
        protected Guid GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
        }

        protected Guid? GetSchoolId()
        {
            if (HttpContext.Items.TryGetValue("SchoolId", out var schoolId) && schoolId is Guid id)
                return id;
            return null;
        }

        protected string GetUserRole()
        {
            return User.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;
        }

        protected Guid RequireSchoolId()
        {
            var schoolId = GetSchoolId();
            if (!schoolId.HasValue)
                throw new UnauthorizedAccessException("School context is required for this operation.");
            return schoolId.Value;
        }
    }
}
