using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LeonEdBackend.DTOs.StudentDtos;
using LeonEdBackend.DTOs.Common;
using LeonEdBackend.Services.Interfaces;

namespace LeonEdBackend.Controllers
{
    [Route("api/[controller]")]
    [Authorize(Roles = "SuperAdmin,SchoolAdmin")]
    public class StudentController : BaseController
    {
        private readonly IStudentService _studentService;
        public StudentController(IStudentService studentService) { _studentService = studentService; }

        /// <summary>List students (paginated, searchable)</summary>
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] PaginationParams p)
        {
            var result = await _studentService.GetStudents(RequireSchoolId(), p);
            return Ok(result);
        }

        /// <summary>Get student by ID</summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var result = await _studentService.GetStudentById(RequireSchoolId(), id);
            return result.Success ? Ok(result) : NotFound(result);
        }

        /// <summary>Create a new student</summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateStudentRequest request)
        {
            var result = await _studentService.CreateStudent(RequireSchoolId(), request);
            return result.Success ? CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result) : BadRequest(result);
        }

        /// <summary>Update a student</summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateStudentRequest request)
        {
            var result = await _studentService.UpdateStudent(RequireSchoolId(), id, request);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>Archive (soft-delete) a student</summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var result = await _studentService.DeleteStudent(RequireSchoolId(), id);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>Search students by name or admission number</summary>
        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string q)
        {
            var result = await _studentService.SearchStudents(RequireSchoolId(), q);
            return Ok(result);
        }
    }
}
