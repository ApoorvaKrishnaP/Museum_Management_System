from locust import HttpUser, task, between

class MuseumUser(HttpUser):
    wait_time = between(1, 3)

    @task
    def submit_feedback(self):
        # The payload must match the FeedbackCreate schema in your backend
        payload = {
            "visitor_id": "test_visitor_123", # Required by your backend
            "feedback_text": "Audio guide was too fast. [Visited Artifacts: Ancient Vase]",
            "rating": 3
        }

        # The URL must match the actual endpoint path defined in @router.post("/api/feedback")
        self.client.post("/api/feedback", json=payload)
