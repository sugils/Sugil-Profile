var typed= new Typed(".text",
{
    strings:["AI/Ml Analyst","Graphic Designer","Full Stack Developer","Python Developer","Gen-AI Developer"],
typeSpeed:100,
backSpeed:100,
baclDelay:1000,
loop:true
}
)

function openResume() {
    document.getElementById("resumeModal").style.display = "block";
}

function closeResume() {
    document.getElementById("resumeModal").style.display = "none";
}
