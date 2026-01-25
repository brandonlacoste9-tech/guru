import axios from "axios";

const API_URL = "http://localhost:4000/api";

async function smokeTest() {
  console.log("🧪 Starting FloGuru Smoke Test...");

  try {
    // 1. Check Health
    console.log("📡 Checking API Health...");
    const health = await axios.get(`${API_URL}/health`);
    console.log("✅ API Status:", health.data.status);

    // 2. Fetch Marketplace Templates
    console.log("🛒 Fetching Marketplace Templates...");
    const templates = await axios.get(`${API_URL}/marketplace/templates`);
    console.log(`✅ Found ${templates.data.length} templates.`);

    if (templates.data.length === 0) {
      throw new Error("No templates found. Did you seed the database?");
    }

    const testTemplate = templates.data[0];
    console.log(`✨ Using template: ${testTemplate.name}`);

    // 3. Create a Guru from Template
    console.log("👷 Creating Guru from template...");
    // We use a mock user ID
    const guruResponse = await axios.post(`${API_URL}/gurus`, {
      templateId: testTemplate.id,
      name: `My ${testTemplate.name}`,
      category: testTemplate.category || "custom",
      personality: "helpful",
    });
    const newGuru = guruResponse.data;
    console.log("✅ Guru created with ID:", newGuru.id);

    // 4. Trigger Execution
    console.log("🚀 Triggering manual execution...");
    // Note: We need to find or create an automation for this guru first
    // In our seed, we only seeded templates. The user builder creates the GURU + AUTOMATIONS.

    // Let's check if the guru has any automations
    const automationTriggerResponse = await axios.post(
      `${API_URL}/gurus/${newGuru.id}/execute`,
      {
        taskDescription: 'Navigate to google.com and search for "FloGuru AI"',
      },
    );

    console.log("✅ Execution result:", automationTriggerResponse.data);
    console.log("🎉 SMOKE TEST PASSED!");
  } catch (error: any) {
    console.error("❌ SMOKE TEST FAILED:");
    if (error.response) {
      console.error("Response Data:", error.response.data);
      console.error("Response Status:", error.response.status);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

smokeTest();
