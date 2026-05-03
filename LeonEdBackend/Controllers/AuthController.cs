using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LeonEdBackend.DTOs.AuthDtos;
using LeonEdBackend.DTOs.Common;
using LeonEdBackend.Services.Interfaces;

namespace LeonEdBackend.Controllers
{
    [Route("api/[controller]")]
    public class AuthController : BaseController
    {
        private readonly IAuthService _authService;
        public AuthController(IAuthService authService) { _authService = authService; }

        /// <summary>Create the platform Super Admin (one-time setup, protected by secret key)</summary>
        [HttpPost("create-super-admin")]
        [AllowAnonymous]
        public async Task<IActionResult> CreateSuperAdmin([FromBody] CreateSuperAdminRequest request)
        {
            var result = await _authService.CreateSuperAdmin(request);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>Register a new school with an admin account</summary>
        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegisterSchoolRequest request)
        {
            var result = await _authService.RegisterSchool(request);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>Login with email and password</summary>
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var result = await _authService.Login(request);
            return result.Success ? Ok(result) : Unauthorized(result);
        }

        /// <summary>Refresh an expired JWT token</summary>
        [HttpPost("refresh-token")]
        [AllowAnonymous]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
        {
            var result = await _authService.RefreshToken(request);
            return result.Success ? Ok(result) : Unauthorized(result);
        }

        /// <summary>Change the current user's password</summary>
        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            var result = await _authService.ChangePassword(GetUserId(), request);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
