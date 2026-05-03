using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LeonEdBackend.Services.Interfaces;

namespace LeonEdBackend.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    public class DashboardController : BaseController
    {
        private readonly IDashboardService _dashboardService;
        public DashboardController(IDashboardService dashboardService) { _dashboardService = dashboardService; }

        [HttpGet("school")]
        [Authorize(Roles = "SuperAdmin,SchoolAdmin")]
        public async Task<IActionResult> GetSchoolDashboard()
        {
            var result = await _dashboardService.GetSchoolDashboard(RequireSchoolId());
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("superadmin")]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> GetSuperAdminDashboard()
        {
            var result = await _dashboardService.GetSuperAdminDashboard();
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("teacher")]
        [Authorize(Roles = "Teacher")]
        public async Task<IActionResult> GetTeacherDashboard()
        {
            var result = await _dashboardService.GetTeacherDashboard(RequireSchoolId(), GetUserId());
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("student")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> GetStudentDashboard()
        {
            var result = await _dashboardService.GetStudentDashboard(RequireSchoolId(), GetUserId());
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
