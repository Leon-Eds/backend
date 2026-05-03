using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LeonEdBackend.DTOs.SessionDtos;
using LeonEdBackend.DTOs.Common;
using LeonEdBackend.Services.Interfaces;

namespace LeonEdBackend.Controllers
{
    [Route("api/[controller]")]
    [Authorize(Roles = "SuperAdmin,SchoolAdmin")]
    public class AcademicSessionController : BaseController
    {
        private readonly IAcademicSessionService _sessionService;
        public AcademicSessionController(IAcademicSessionService sessionService) { _sessionService = sessionService; }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _sessionService.GetSessions(RequireSchoolId());
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateSession([FromBody] CreateSessionRequest request)
        {
            var result = await _sessionService.CreateSession(RequireSchoolId(), request);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPut("{id}/current")]
        public async Task<IActionResult> SetCurrentSession(Guid id)
        {
            var result = await _sessionService.SetCurrentSession(RequireSchoolId(), id);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("{id}/terms")]
        public async Task<IActionResult> CreateTerm(Guid id, [FromBody] CreateTermRequest request)
        {
            var result = await _sessionService.CreateTerm(RequireSchoolId(), id, request);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPut("terms/{termId}/current")]
        public async Task<IActionResult> SetCurrentTerm(Guid termId)
        {
            var result = await _sessionService.SetCurrentTerm(RequireSchoolId(), termId);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
