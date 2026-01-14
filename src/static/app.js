document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      
      // Clear dropdown options (keep the first default option)
      while (activitySelect.options.length > 1) {
        activitySelect.remove(1);
      }

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants list with delete icon
        let participantsListHtml = '';
        if (details.participants.length > 0) {
          participantsListHtml = `<ul class="participants-list" style="list-style-type:none; padding-left:0;">` +
            details.participants.map(p =>
              `<li style="display:flex;align-items:center;gap:6px;">
                <span style="flex:1;">${p}</span>
                <button class="delete-participant-btn" data-activity="${encodeURIComponent(name)}" data-email="${encodeURIComponent(p)}" title="Unregister" style="background:none;border:none;cursor:pointer;font-size:1em;">🗑️</button>
              </li>`
            ).join("") +
            `</ul>`;
        } else {
          participantsListHtml = "<p class='no-participants'><em>No participants yet</em></p>";
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <strong>Current Participants:</strong>
            ${participantsListHtml}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners for delete buttons
      document.querySelectorAll('.delete-participant-btn').forEach(btn => {
        btn.addEventListener('click', async function(e) {
          const activity = decodeURIComponent(this.getAttribute('data-activity'));
          const email = decodeURIComponent(this.getAttribute('data-email'));
          try {
            const response = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, {
              method: 'POST',
            });
            const result = await response.json();
            if (response.ok) {
              messageDiv.textContent = result.message || 'Participant unregistered.';
              messageDiv.className = 'success';
              fetchActivities();
            } else {
              messageDiv.textContent = result.detail || 'Failed to unregister participant.';
              messageDiv.className = 'error';
            }
            messageDiv.classList.remove('hidden');
            setTimeout(() => { messageDiv.classList.add('hidden'); }, 5000);
          } catch (error) {
            messageDiv.textContent = 'Failed to unregister participant.';
            messageDiv.className = 'error';
            messageDiv.classList.remove('hidden');
            setTimeout(() => { messageDiv.classList.add('hidden'); }, 5000);
            console.error('Error unregistering participant:', error);
          }
        });
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
