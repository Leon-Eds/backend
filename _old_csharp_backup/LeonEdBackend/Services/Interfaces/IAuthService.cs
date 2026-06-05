using LeonEdBackend.DTOs.AuthDtos;
using LeonEdBackend.DTOs.Common;

namespace LeonEdBackend.Services.Interfaces
{
    public interface IAuthService
    {
        Task<ApiResponse<AuthResponse>> RegisterSchool(RegisterSchoolRequest request);
        Task<ApiResponse<AuthResponse>> Login(LoginRequest request);
        Task<ApiResponse<AuthResponse>> RefreshToken(RefreshTokenRequest request);
        Task<ApiResponse<bool>> ChangePassword(Guid userId, ChangePasswordRequest request);
        Task<ApiResponse<AuthResponse>> CreateSuperAdmin(CreateSuperAdminRequest request);
    }
}
