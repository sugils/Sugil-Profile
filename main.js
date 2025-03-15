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

if (window.location.search) {
    window.history.replaceState({}, document.title, window.location.pathname);
}

document.addEventListener("DOMContentLoaded", function () {
    emailjs.init("gLwmgYS20sKhG4pM0"); // Initialize EmailJS

    document.getElementById("contact-form").addEventListener("submit", function (event) {
        event.preventDefault(); // Prevent default form submission

        // Getting values from input fields
        let name = document.getElementById("name").value.trim();
        let email = document.getElementById("email").value.trim();
        let subject = document.getElementById("subject").value.trim();
        let message = document.getElementById("message").value.trim();

        console.log("Name:", name);
        console.log("Email:", email);
        console.log("Subject:", subject);
        console.log("Message:", message);

        // Validate inputs
        if (!name || !email || !subject || !message) {
            alert("❌ Please fill out all fields before sending.");
            return;
        }

        // Matching EmailJS Template Variables
        let templateParams = {
            name: name,        // Matches {{name}} in EmailJS template
            email: email,      // Matches {{email}} in EmailJS template
            subject: subject,  // Matches {{subject}} in EmailJS template
            message: message   // Matches {{message}} in EmailJS template
        };

        // Sending email using EmailJS
        emailjs.send("service_dmjrtz9", "template_zyb7utf", templateParams)
            .then(function (response) {
                console.log("✅ Email sent successfully!", response);
                document.getElementById("status-message").textContent = "✅ Message Sent Successfully!";
                document.getElementById("contact-form").reset();
                alert("✅ Message Sent Successfully!");
            })
            .catch(function (error) {
                console.error("❌ Error sending email:", error);
                document.getElementById("status-message").textContent = "❌ Error Sending Message. Try Again!";
                alert("❌ Error Sending Message. Check console for details.");
            });
    });
});
