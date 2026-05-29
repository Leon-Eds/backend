using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using LeonEdBackend.Data;
using LeonEdBackend.DTOs.Common;
using LeonEdBackend.DTOs.ReportCardDtos;
using LeonEdBackend.DTOs.ScoreDtos;
using LeonEdBackend.Services.Interfaces;

namespace LeonEdBackend.Services.Implementations
{
    public class ReportCardService : IReportCardService
    {
        private readonly AppDbContext _context;
        private readonly IGradingService _gradingService;

        public ReportCardService(AppDbContext context, IGradingService gradingService)
        {
            _context = context;
            _gradingService = gradingService;
        }

        public async Task<ApiResponse<ReportCardResponse>> GenerateReportCard(Guid schoolId, Guid studentId, Guid termId)
        {
            var result = await _context.Results
                .Include(r => r.Student)
                .Include(r => r.Class)
                .Include(r => r.Term).ThenInclude(t => t.AcademicSession)
                .FirstOrDefaultAsync(r => r.SchoolId == schoolId && r.StudentId == studentId && r.TermId == termId);

            if (result == null)
                return ApiResponse<ReportCardResponse>.FailResponse("Result not found for this student and term.");

            var school = await _context.Schools.FindAsync(schoolId);
            if (school == null)
                return ApiResponse<ReportCardResponse>.FailResponse("School not found.");

            var totalInClass = await _context.Results
                .CountAsync(r => r.SchoolId == schoolId && r.ClassId == result.ClassId && r.TermId == termId);

            var scores = await _context.Scores
                .Include(s => s.Subject)
                .Where(s => s.SchoolId == schoolId && s.StudentId == studentId && s.TermId == termId)
                .OrderBy(s => s.Subject.Name)
                .ToListAsync();

            var gradingRulesResult = await _gradingService.GetGradingRules(schoolId);

            var reportCard = new ReportCardResponse
            {
                SchoolName = school.Name,
                SchoolAddress = school.Address,
                SchoolEmail = school.ContactEmail,
                SchoolPhone = school.ContactPhone,
                SchoolLogoUrl = school.LogoUrl,
                StudentName = result.Student.FullName,
                AdmissionNumber = result.Student.AdmissionNumber,
                ClassName = $"{result.Class.Name} {result.Class.Arm}".Trim(),
                Gender = result.Student.Gender.ToString(),
                AcademicSession = result.Term.AcademicSession.Name,
                Term = result.Term.TermNumber.ToString(),
                TotalScore = result.TotalScore,
                Average = result.Average,
                Position = result.Position,
                TotalStudentsInClass = totalInClass,
                SubjectCount = result.SubjectCount,
                TeacherComment = result.TeacherComment,
                AdminComment = result.AdminComment,
                SubjectScores = scores.Select(s => new ScoreResponse
                {
                    Id = s.Id,
                    StudentId = s.StudentId,
                    StudentName = result.Student.FullName,
                    AdmissionNumber = result.Student.AdmissionNumber,
                    SubjectId = s.SubjectId,
                    SubjectName = s.Subject.Name,
                    FirstCA = s.FirstCA,
                    SecondCA = s.SecondCA,
                    Exam = s.Exam,
                    Total = s.Total,
                    Grade = s.Grade.ToString(),
                    Remark = s.Remark
                }).ToList(),
                GradingKey = gradingRulesResult.Data?.Select(g => new GradingKeyEntry
                {
                    Grade = g.Grade,
                    MinScore = g.MinScore,
                    MaxScore = g.MaxScore,
                    Remark = g.Remark
                }).ToList() ?? new List<GradingKeyEntry>()
            };

            return ApiResponse<ReportCardResponse>.SuccessResponse(reportCard, "Report card generated.");
        }

        public async Task<ApiResponse<byte[]>> GenerateReportCardPdf(Guid schoolId, Guid studentId, Guid termId)
        {
            var reportCardResult = await GenerateReportCard(schoolId, studentId, termId);
            if (!reportCardResult.Success || reportCardResult.Data == null)
                return ApiResponse<byte[]>.FailResponse(reportCardResult.Message);

            var data = reportCardResult.Data;

            var pdfBytes = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(30);
                    page.DefaultTextStyle(x => x.FontSize(10));

                    // Header
                    page.Header().Column(col =>
                    {
                        col.Item().AlignCenter().Text(data.SchoolName)
                            .Bold().FontSize(18).FontColor(Colors.Blue.Darken3);

                        col.Item().AlignCenter().Text(data.SchoolAddress)
                            .FontSize(9).FontColor(Colors.Grey.Darken1);

                        col.Item().AlignCenter().Text($"Email: {data.SchoolEmail} | Phone: {data.SchoolPhone}")
                            .FontSize(8).FontColor(Colors.Grey.Darken1);

                        col.Item().PaddingVertical(5).LineHorizontal(2).LineColor(Colors.Blue.Darken3);

                        col.Item().AlignCenter().PaddingBottom(10)
                            .Text("STUDENT REPORT CARD")
                            .Bold().FontSize(14).FontColor(Colors.Blue.Darken2);
                    });

                    // Content
                    page.Content().Column(col =>
                    {
                        // Student info section
                        col.Item().Border(1).BorderColor(Colors.Grey.Lighten1).Padding(10).Column(info =>
                        {
                            info.Item().Row(row =>
                            {
                                row.RelativeItem().Text(t =>
                                {
                                    t.Span("Name: ").Bold();
                                    t.Span(data.StudentName);
                                });
                                row.RelativeItem().Text(t =>
                                {
                                    t.Span("Admission No: ").Bold();
                                    t.Span(data.AdmissionNumber);
                                });
                            });

                            info.Item().PaddingTop(5).Row(row =>
                            {
                                row.RelativeItem().Text(t =>
                                {
                                    t.Span("Class: ").Bold();
                                    t.Span(data.ClassName);
                                });
                                row.RelativeItem().Text(t =>
                                {
                                    t.Span("Gender: ").Bold();
                                    t.Span(data.Gender);
                                });
                            });

                            info.Item().PaddingTop(5).Row(row =>
                            {
                                row.RelativeItem().Text(t =>
                                {
                                    t.Span("Academic Session: ").Bold();
                                    t.Span(data.AcademicSession);
                                });
                                row.RelativeItem().Text(t =>
                                {
                                    t.Span("Term: ").Bold();
                                    t.Span(data.Term);
                                });
                            });
                        });

                        col.Item().PaddingTop(15);

                        // Scores table
                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.ConstantColumn(30);   // S/N
                                columns.RelativeColumn(3);    // Subject
                                columns.RelativeColumn(1);    // CA1
                                columns.RelativeColumn(1);    // CA2
                                columns.RelativeColumn(1);    // Exam
                                columns.RelativeColumn(1);    // Total
                                columns.RelativeColumn(1);    // Grade
                                columns.RelativeColumn(1.5f); // Remark
                            });

                            // Table header
                            table.Header(header =>
                            {
                                header.Cell().Background(Colors.Blue.Darken3).Padding(5)
                                    .Text("S/N").Bold().FontColor(Colors.White).FontSize(9);
                                header.Cell().Background(Colors.Blue.Darken3).Padding(5)
                                    .Text("Subject").Bold().FontColor(Colors.White).FontSize(9);
                                header.Cell().Background(Colors.Blue.Darken3).Padding(5)
                                    .Text("CA1 (20)").Bold().FontColor(Colors.White).FontSize(9);
                                header.Cell().Background(Colors.Blue.Darken3).Padding(5)
                                    .Text("CA2 (20)").Bold().FontColor(Colors.White).FontSize(9);
                                header.Cell().Background(Colors.Blue.Darken3).Padding(5)
                                    .Text("Exam (60)").Bold().FontColor(Colors.White).FontSize(9);
                                header.Cell().Background(Colors.Blue.Darken3).Padding(5)
                                    .Text("Total (100)").Bold().FontColor(Colors.White).FontSize(9);
                                header.Cell().Background(Colors.Blue.Darken3).Padding(5)
                                    .Text("Grade").Bold().FontColor(Colors.White).FontSize(9);
                                header.Cell().Background(Colors.Blue.Darken3).Padding(5)
                                    .Text("Remark").Bold().FontColor(Colors.White).FontSize(9);
                            });

                            // Table rows
                            for (int i = 0; i < data.SubjectScores.Count; i++)
                            {
                                var score = data.SubjectScores[i];
                                var bgColor = i % 2 == 0 ? Colors.White : Colors.Grey.Lighten4;

                                table.Cell().Background(bgColor).BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(4)
                                    .Text($"{i + 1}").FontSize(9);
                                table.Cell().Background(bgColor).BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(4)
                                    .Text(score.SubjectName).FontSize(9);
                                table.Cell().Background(bgColor).BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(4)
                                    .AlignCenter().Text($"{score.FirstCA}").FontSize(9);
                                table.Cell().Background(bgColor).BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(4)
                                    .AlignCenter().Text($"{score.SecondCA}").FontSize(9);
                                table.Cell().Background(bgColor).BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(4)
                                    .AlignCenter().Text($"{score.Exam}").FontSize(9);
                                table.Cell().Background(bgColor).BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(4)
                                    .AlignCenter().Text($"{score.Total}").Bold().FontSize(9);
                                table.Cell().Background(bgColor).BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(4)
                                    .AlignCenter().Text(score.Grade).Bold().FontSize(9);
                                table.Cell().Background(bgColor).BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(4)
                                    .Text(score.Remark).FontSize(8);
                            }
                        });

                        col.Item().PaddingTop(10);

                        // Summary section
                        col.Item().Background(Colors.Blue.Lighten5).Border(1).BorderColor(Colors.Blue.Darken3)
                            .Padding(10).Column(summary =>
                        {
                            summary.Item().Row(row =>
                            {
                                row.RelativeItem().Text(t =>
                                {
                                    t.Span("Total Score: ").Bold();
                                    t.Span($"{data.TotalScore}");
                                });
                                row.RelativeItem().Text(t =>
                                {
                                    t.Span("Average: ").Bold();
                                    t.Span($"{data.Average:F2}");
                                });
                            });

                            summary.Item().PaddingTop(5).Row(row =>
                            {
                                row.RelativeItem().Text(t =>
                                {
                                    t.Span("Position: ").Bold();
                                    t.Span($"{GetOrdinal(data.Position)} out of {data.TotalStudentsInClass} students");
                                });
                                row.RelativeItem().Text(t =>
                                {
                                    t.Span("Subjects: ").Bold();
                                    t.Span($"{data.SubjectCount}");
                                });
                            });
                        });

                        col.Item().PaddingTop(10);

                        // Comments section
                        if (!string.IsNullOrWhiteSpace(data.TeacherComment) || !string.IsNullOrWhiteSpace(data.AdminComment))
                        {
                            col.Item().Border(1).BorderColor(Colors.Grey.Lighten1).Padding(10).Column(comments =>
                            {
                                if (!string.IsNullOrWhiteSpace(data.TeacherComment))
                                {
                                    comments.Item().Text(t =>
                                    {
                                        t.Span("Teacher's Comment: ").Bold();
                                        t.Span(data.TeacherComment).Italic();
                                    });
                                }

                                if (!string.IsNullOrWhiteSpace(data.AdminComment))
                                {
                                    comments.Item().PaddingTop(5).Text(t =>
                                    {
                                        t.Span("Principal's Comment: ").Bold();
                                        t.Span(data.AdminComment).Italic();
                                    });
                                }
                            });
                        }

                        col.Item().PaddingTop(10);

                        // Grading key
                        if (data.GradingKey.Any())
                        {
                            col.Item().Text("Grading Key").Bold().FontSize(9);
                            col.Item().PaddingTop(3).Table(gradeTable =>
                            {
                                gradeTable.ColumnsDefinition(columns =>
                                {
                                    columns.RelativeColumn(1);
                                    columns.RelativeColumn(2);
                                    columns.RelativeColumn(2);
                                });

                                gradeTable.Header(header =>
                                {
                                    header.Cell().Background(Colors.Grey.Lighten3).Padding(3)
                                        .Text("Grade").Bold().FontSize(8);
                                    header.Cell().Background(Colors.Grey.Lighten3).Padding(3)
                                        .Text("Score Range").Bold().FontSize(8);
                                    header.Cell().Background(Colors.Grey.Lighten3).Padding(3)
                                        .Text("Remark").Bold().FontSize(8);
                                });

                                foreach (var key in data.GradingKey)
                                {
                                    gradeTable.Cell().Padding(2).Text(key.Grade).FontSize(8);
                                    gradeTable.Cell().Padding(2).Text($"{key.MinScore} - {key.MaxScore}").FontSize(8);
                                    gradeTable.Cell().Padding(2).Text(key.Remark).FontSize(8);
                                }
                            });
                        }
                    });

                    // Footer
                    page.Footer().AlignCenter().Text(t =>
                    {
                        t.Span("Generated by LeonEd Africa | ").FontSize(8).FontColor(Colors.Grey.Medium);
                        t.Span(DateTime.Now.ToString("dd MMM yyyy")).FontSize(8).FontColor(Colors.Grey.Medium);
                    });
                });
            }).GeneratePdf();

            return ApiResponse<byte[]>.SuccessResponse(pdfBytes, "Report card PDF generated.");
        }

        private static string GetOrdinal(int number)
        {
            if (number <= 0) return number.ToString();

            var suffix = (number % 100) switch
            {
                11 or 12 or 13 => "th",
                _ => (number % 10) switch
                {
                    1 => "st",
                    2 => "nd",
                    3 => "rd",
                    _ => "th"
                }
            };

            return $"{number}{suffix}";
        }
    }
}
