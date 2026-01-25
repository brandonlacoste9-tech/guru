import { Router } from "express";
import { guruService } from "../services/guruService";

const router = Router();

// Mock auth
const authenticate = (req: any, res: any, next: any) => {
  req.user = { id: "00000000-0000-0000-0000-000000000000" };
  next();
};

router.get("/templates", async (req, res) => {
  try {
    const templates = await guruService.listGuruTemplates(req.query);
    res.json(templates);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/templates/:id/use", authenticate, async (req, res) => {
  try {
    const guru = await guruService.createGuruFromTemplate(
      req.params.id,
      (req as any).user.id,
      req.body,
    );
    res.status(201).json(guru);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/templates", authenticate, async (req, res) => {
  try {
    const template = await guruService.createGuruTemplate(
      req.body,
      (req as any).user.id,
    );
    res.status(201).json(template);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
