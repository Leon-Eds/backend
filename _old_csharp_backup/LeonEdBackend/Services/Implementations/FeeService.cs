using Microsoft.EntityFrameworkCore;
using LeonEdBackend.Data;
using LeonEdBackend.DTOs.Common;
using LeonEdBackend.DTOs.FeeDtos;
using LeonEdBackend.Helpers;
using LeonEdBackend.Models;
using LeonEdBackend.Services.Interfaces;

namespace LeonEdBackend.Services.Implementations
{
    public class FeeService : IFeeService
    {
        private readonly AppDbContext _context;

        public FeeService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ApiResponse<FeePaymentResponse>> RecordPayment(Guid schoolId, RecordFeePaymentRequest request)
        {
            var student = await _context.Students
                .FirstOrDefaultAsync(s => s.Id == request.StudentId && s.SchoolId == schoolId);
            if (student == null)
                return ApiResponse<FeePaymentResponse>.FailResponse("Student not found in this school.");

            // Upsert fee record
            var existing = await _context.FeePayments
                .FirstOrDefaultAsync(f =>
                    f.SchoolId == schoolId &&
                    f.StudentId == request.StudentId &&
                    f.TermId == request.TermId);

            if (existing != null)
            {
                existing.AmountDue = request.AmountDue;
                existing.AmountPaid = request.AmountPaid;
                existing.Status = request.AmountPaid >= request.AmountDue ? PaymentStatus.Cleared : PaymentStatus.Pending;
                existing.UpdatedAt = DateTime.UtcNow;

                if (existing.Status == PaymentStatus.Cleared && existing.ClearedAt == null)
                {
                    existing.ClearedAt = DateTime.UtcNow;
                }
            }
            else
            {
                var status = request.AmountPaid >= request.AmountDue ? PaymentStatus.Cleared : PaymentStatus.Pending;
                existing = new FeePayment
                {
                    Id = Guid.NewGuid(),
                    SchoolId = schoolId,
                    StudentId = request.StudentId,
                    TermId = request.TermId,
                    AcademicSessionId = request.AcademicSessionId,
                    AmountDue = request.AmountDue,
                    AmountPaid = request.AmountPaid,
                    Status = status,
                    ClearedAt = status == PaymentStatus.Cleared ? DateTime.UtcNow : null
                };
                _context.FeePayments.Add(existing);
            }

            await _context.SaveChangesAsync();

            return ApiResponse<FeePaymentResponse>.SuccessResponse(MapToResponse(existing, student), "Fee payment recorded.");
        }

        public async Task<ApiResponse<FeePaymentResponse>> GetStudentFeeStatus(Guid schoolId, Guid studentId, Guid termId)
        {
            var student = await _context.Students
                .FirstOrDefaultAsync(s => s.Id == studentId && s.SchoolId == schoolId);
            if (student == null)
                return ApiResponse<FeePaymentResponse>.FailResponse("Student not found.");

            var fee = await _context.FeePayments
                .FirstOrDefaultAsync(f => f.SchoolId == schoolId && f.StudentId == studentId && f.TermId == termId);

            if (fee == null)
            {
                // No fee record means not yet recorded
                return ApiResponse<FeePaymentResponse>.SuccessResponse(new FeePaymentResponse
                {
                    StudentId = studentId,
                    StudentName = student.FullName,
                    AdmissionNumber = student.AdmissionNumber,
                    AmountDue = 0,
                    AmountPaid = 0,
                    Balance = 0,
                    Status = "NotRecorded",
                    IsCleared = false
                }, "No fee record found for this term.");
            }

            return ApiResponse<FeePaymentResponse>.SuccessResponse(MapToResponse(fee, student), "Fee status retrieved.");
        }

        public async Task<ApiResponse<ClassFeeOverviewResponse>> GetClassFeeOverview(Guid schoolId, Guid classId, Guid termId)
        {
            var classEntity = await _context.Classes
                .FirstOrDefaultAsync(c => c.Id == classId && c.SchoolId == schoolId);
            if (classEntity == null)
                return ApiResponse<ClassFeeOverviewResponse>.FailResponse("Class not found.");

            var term = await _context.Terms
                .Include(t => t.AcademicSession)
                .FirstOrDefaultAsync(t => t.Id == termId);
            if (term == null)
                return ApiResponse<ClassFeeOverviewResponse>.FailResponse("Term not found.");

            var students = await _context.Students
                .Where(s => s.SchoolId == schoolId && s.ClassId == classId && s.Status == StudentStatus.Active)
                .ToListAsync();

            var fees = await _context.FeePayments
                .Where(f => f.SchoolId == schoolId && f.TermId == termId)
                .ToListAsync();

            var studentFees = students.Select(student =>
            {
                var fee = fees.FirstOrDefault(f => f.StudentId == student.Id);
                if (fee != null)
                    return MapToResponse(fee, student);

                return new FeePaymentResponse
                {
                    StudentId = student.Id,
                    StudentName = student.FullName,
                    AdmissionNumber = student.AdmissionNumber,
                    AmountDue = 0,
                    AmountPaid = 0,
                    Balance = 0,
                    Status = "NotRecorded",
                    IsCleared = false
                };
            }).ToList();

            return ApiResponse<ClassFeeOverviewResponse>.SuccessResponse(new ClassFeeOverviewResponse
            {
                ClassId = classEntity.Id,
                ClassName = $"{classEntity.Name} {classEntity.Arm}".Trim(),
                TermName = term.TermNumber.ToString(),
                TotalStudents = studentFees.Count,
                ClearedCount = studentFees.Count(f => f.IsCleared),
                PendingCount = studentFees.Count(f => !f.IsCleared),
                TotalAmountDue = studentFees.Sum(f => f.AmountDue),
                TotalAmountPaid = studentFees.Sum(f => f.AmountPaid),
                Students = studentFees
            }, "Class fee overview retrieved.");
        }

        public async Task<ApiResponse<FeePaymentResponse>> ClearStudent(Guid schoolId, Guid studentId, Guid termId, Guid clearedByUserId)
        {
            var student = await _context.Students
                .FirstOrDefaultAsync(s => s.Id == studentId && s.SchoolId == schoolId);
            if (student == null)
                return ApiResponse<FeePaymentResponse>.FailResponse("Student not found.");

            var fee = await _context.FeePayments
                .FirstOrDefaultAsync(f => f.SchoolId == schoolId && f.StudentId == studentId && f.TermId == termId);

            if (fee == null)
            {
                // Create a cleared record
                fee = new FeePayment
                {
                    Id = Guid.NewGuid(),
                    SchoolId = schoolId,
                    StudentId = studentId,
                    TermId = termId,
                    AcademicSessionId = (await _context.Terms.FindAsync(termId))!.AcademicSessionId,
                    AmountDue = 0,
                    AmountPaid = 0,
                    Status = PaymentStatus.Cleared,
                    ClearedByUserId = clearedByUserId,
                    ClearedAt = DateTime.UtcNow
                };
                _context.FeePayments.Add(fee);
            }
            else
            {
                fee.Status = PaymentStatus.Cleared;
                fee.ClearedByUserId = clearedByUserId;
                fee.ClearedAt = DateTime.UtcNow;
                fee.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return ApiResponse<FeePaymentResponse>.SuccessResponse(MapToResponse(fee, student), "Student fee cleared.");
        }

        public async Task<bool> IsStudentCleared(Guid schoolId, Guid studentId, Guid termId)
        {
            var fee = await _context.FeePayments
                .FirstOrDefaultAsync(f => f.SchoolId == schoolId && f.StudentId == studentId && f.TermId == termId);

            return fee?.Status == PaymentStatus.Cleared;
        }

        private static FeePaymentResponse MapToResponse(FeePayment fee, Student student)
        {
            return new FeePaymentResponse
            {
                Id = fee.Id,
                StudentId = fee.StudentId,
                StudentName = student.FullName,
                AdmissionNumber = student.AdmissionNumber,
                AmountDue = fee.AmountDue,
                AmountPaid = fee.AmountPaid,
                Balance = fee.AmountDue - fee.AmountPaid,
                Status = fee.Status.ToString(),
                IsCleared = fee.Status == PaymentStatus.Cleared,
                ClearedAt = fee.ClearedAt
            };
        }
    }
}
