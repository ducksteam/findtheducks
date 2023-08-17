function deletePrompt() {
	if(confirm("Are you sure you want to delete your account?")){ // If user confirms
		window.location.href = "/users/delete"; // Redirect to delete route
	}
}