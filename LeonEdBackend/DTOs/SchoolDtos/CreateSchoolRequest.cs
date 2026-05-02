using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace LeonEdBackend.DTOs.SchoolDtos
{
    public class CreateSchoolRequest
    {
        public string Name {get; set;} = string.Empty;
        public string Address {get; set;} = string.Empty;
        public string ContactEmail {get; set;} = string.Empty;
        public string ContactPhone {get; set;} = string.Empty;
        public string LogoUrl {get; set;} = string.Empty;
        public string Password {get; set;} = string.Empty;
    }
}