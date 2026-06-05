using Microsoft.EntityFrameworkCore;
using LeonEdBackend.Data;
using LeonEdBackend.DTOs.Common;
using LeonEdBackend.DTOs.SchoolDtos;
using LeonEdBackend.Helpers;
using LeonEdBackend.Services.Interfaces;

namespace LeonEdBackend.Services.Implementations
{
    public class SchoolService : ISchoolService
    {
        private readonly AppDbContext _context;

        public SchoolService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ApiResponse<PagedResult<SchoolResponse>>> GetAllSchools(PaginationParams paginationParams)
        {
            var query = _context.Schools.AsQueryable();

            if (!string.IsNullOrWhiteSpace(paginationParams.Search))
            {
                var search = paginationParams.Search.ToLower();
                query = query.Where(s => s.Name.ToLower().Contains(search) ||
                                         s.ContactEmail.ToLower().Contains(search));
            }

            var totalCount = await query.CountAsync();

            var schools = await query
                .OrderByDescending(s => s.CreatedAt)
                .Skip((paginationParams.PageNumber - 1) * paginationParams.PageSize)
                .Take(paginationParams.PageSize)
                .Select(s => new SchoolResponse
                {
                    Id = s.Id,
                    Name = s.Name,
                    Address = s.Address,
                    ContactEmail = s.ContactEmail,
                    ContactPhone = s.ContactPhone,
                    LogoUrl = s.LogoUrl,
                    Slug = s.Slug,
                    SubscriptionPlan = s.SubscriptionPlan.ToString(),
                    SubscriptionStatus = s.SubscriptionStatus.ToString(),
                    IsActive = s.IsActive,
                    MaxTeachers = s.SubscriptionPlan == SubscriptionPlan.Free ? 20 :
                                  s.SubscriptionPlan == SubscriptionPlan.Plus ? 30 : int.MaxValue,
                    MaxStudents = s.SubscriptionPlan == SubscriptionPlan.Free ? 100 :
                                  s.SubscriptionPlan == SubscriptionPlan.Plus ? 200 : int.MaxValue,
                    CurrentTeacherCount = s.Teachers.Count(t => t.IsActive),
                    CurrentStudentCount = s.Students.Count(st => st.Status == StudentStatus.Active),
                    CreatedAt = s.CreatedAt
                })
                .ToListAsync();

            var result = new PagedResult<SchoolResponse>
            {
                Items = schools,
                TotalCount = totalCount,
                PageNumber = paginationParams.PageNumber,
                PageSize = paginationParams.PageSize
            };

            return ApiResponse<PagedResult<SchoolResponse>>.SuccessResponse(result);
        }

        public async Task<ApiResponse<SchoolResponse>> GetSchoolById(Guid id)
        {
            var school = await _context.Schools
                .Include(s => s.Teachers)
                .Include(s => s.Students)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (school == null)
            {
                return ApiResponse<SchoolResponse>.FailResponse("School not found.");
            }

            var response = MapToResponse(school);
            return ApiResponse<SchoolResponse>.SuccessResponse(response);
        }

        public async Task<ApiResponse<SchoolResponse>> UpdateSchool(Guid id, UpdateSchoolRequest request)
        {
            var school = await _context.Schools
                .Include(s => s.Teachers)
                .Include(s => s.Students)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (school == null)
            {
                return ApiResponse<SchoolResponse>.FailResponse("School not found.");
            }

            if (!string.IsNullOrWhiteSpace(request.Name)) school.Name = request.Name;
            if (!string.IsNullOrWhiteSpace(request.Address)) school.Address = request.Address;
            if (!string.IsNullOrWhiteSpace(request.ContactEmail)) school.ContactEmail = request.ContactEmail;
            if (!string.IsNullOrWhiteSpace(request.ContactPhone)) school.ContactPhone = request.ContactPhone;
            if (!string.IsNullOrWhiteSpace(request.LogoUrl)) school.LogoUrl = request.LogoUrl;
            school.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var response = MapToResponse(school);
            return ApiResponse<SchoolResponse>.SuccessResponse(response, "School updated successfully.");
        }

        public async Task<ApiResponse<SchoolResponse>> UpdateSchoolPlan(Guid schoolId, SubscriptionPlan plan)
        {
            var school = await _context.Schools
                .Include(s => s.Teachers)
                .Include(s => s.Students)
                .FirstOrDefaultAsync(s => s.Id == schoolId);

            if (school == null)
            {
                return ApiResponse<SchoolResponse>.FailResponse("School not found.");
            }

            school.SubscriptionPlan = plan;
            school.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var response = MapToResponse(school);
            return ApiResponse<SchoolResponse>.SuccessResponse(response, "Subscription plan updated successfully.");
        }

        public async Task<ApiResponse<bool>> UpdateSchoolStatus(Guid schoolId, bool isActive)
        {
            var school = await _context.Schools.FindAsync(schoolId);
            if (school == null)
            {
                return ApiResponse<bool>.FailResponse("School not found.");
            }

            school.IsActive = isActive;
            school.SubscriptionStatus = isActive ? SubscriptionStatus.Active : SubscriptionStatus.Suspended;
            school.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var message = isActive ? "School activated successfully." : "School suspended successfully.";
            return ApiResponse<bool>.SuccessResponse(true, message);
        }

        public Task<List<SubscriptionPlanInfo>> GetSubscriptionPlans()
        {
            var plans = new List<SubscriptionPlanInfo>
            {
                new() { Name = "Free", MaxTeachers = 20, MaxStudents = 100, Description = "Basic plan with up to 20 teachers and 100 students." },
                new() { Name = "Plus", MaxTeachers = 30, MaxStudents = 200, Description = "Enhanced plan with up to 30 teachers and 200 students." },
                new() { Name = "Premium", MaxTeachers = int.MaxValue, MaxStudents = int.MaxValue, Description = "Unlimited teachers and students." }
            };
            return Task.FromResult(plans);
        }

        private static SchoolResponse MapToResponse(Models.School school)
        {
            return new SchoolResponse
            {
                Id = school.Id,
                Name = school.Name,
                Address = school.Address,
                ContactEmail = school.ContactEmail,
                ContactPhone = school.ContactPhone,
                LogoUrl = school.LogoUrl,
                Slug = school.Slug,
                SubscriptionPlan = school.SubscriptionPlan.ToString(),
                SubscriptionStatus = school.SubscriptionStatus.ToString(),
                IsActive = school.IsActive,
                MaxTeachers = school.MaxTeachers,
                MaxStudents = school.MaxStudents,
                CurrentTeacherCount = school.Teachers.Count(t => t.IsActive),
                CurrentStudentCount = school.Students.Count(s => s.Status == StudentStatus.Active),
                CreatedAt = school.CreatedAt
            };
        }
    }
}
