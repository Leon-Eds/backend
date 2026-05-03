using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LeonEdBackend.DTOs.TeacherDtos;
using LeonEdBackend.DTOs.Common;
using LeonEdBackend.Services.Interfaces;

namespace LeonEdBackend.Controllers
{
    [Route("api/[controller]")]
    [Authorize(Roles = "SuperAdmin,SchoolAdmin")]
    public class TeacherController : BaseController
    {
        private readonly ITeacherService _teacherService;
        public TeacherController(ITeacherService teacherService) { _teacherService = teacherService; }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] PaginationParams p)
        {
            var result = await _teacherService.GetTeachers(RequireSchoolId(), p);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var result = await _teacherService.GetTeacherById(RequireSchoolId(), id);
            return result.Success ? Ok(result) : NotFound(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateTeacherRequest request)
        {
            var result = await _teacherService.CreateTeacher(RequireSchoolId(), request);
            return result.Success ? CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result) : BadRequest(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTeacherRequest request)
        {
            var result = await _teacherService.UpdateTeacher(RequireSchoolId(), id, request);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromQuery] bool isActive)
        {
            var result = await _teacherService.UpdateTeacherStatus(RequireSchoolId(), id, isActive);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("{id}/assign")]
        public async Task<IActionResult> Assign(Guid id, [FromBody] AssignTeacherRequest request)
        {
            var result = await _teacherService.AssignTeacher(RequireSchoolId(), id, request);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpDelete("assignment/{assignmentId}")]
        public async Task<IActionResult> RemoveAssignment(Guid assignmentId)
        {
            var result = await _teacherService.RemoveAssignment(RequireSchoolId(), assignmentId);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
