
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../lib/axios";
import PageHeader from "../components/ui/PageHeader";
import SurfaceCard from "../components/ui/SurfaceCard";
import StatusBadge from "../components/ui/StatusBadge";

export default function LeadDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [lead, setLead] = useState(null);

  useEffect(() => {
    fetchLead();
  }, [id]);

  const fetchLead = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/leads/${id}`);
      setLead(data.lead);
    } catch (err) {
      toast.error("Failed to load lead");
    } finally {
      setLoading(false);
    }
  };

  const convertLead = async () => {
    try {
      await api.post(`/leads/${id}/convert`);
      toast.success("Lead converted successfully");
      fetchLead();
    } catch {
      toast.error("Conversion failed");
    }
  };

  if (loading) return <div className="page-container">Loading...</div>;
  if (!lead) return <div className="page-container">Lead not found.</div>;

  return (
    <div className="page-container space-y-6">
      <PageHeader
        title={lead.name}
        description={lead.company || "Lead Details"}
      />

      <SurfaceCard>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p><strong>Email:</strong> {lead.email}</p>
            <p><strong>Phone:</strong> {lead.phone}</p>
            <p><strong>Company:</strong> {lead.company}</p>
            <p><strong>Budget:</strong> ₹{lead.budget}</p>
            <p><strong>Source:</strong> {lead.source}</p>
          </div>

          <div>
            <StatusBadge status={lead.status} />
            <p className="mt-4"><strong>Priority:</strong> {lead.priority}</p>
            <p><strong>Follow Up:</strong> {lead.followUpDate ?
              new Date(lead.followUpDate).toLocaleDateString() : "-"}</p>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard>
        <h2 className="text-lg font-semibold mb-3">Requirements</h2>
        <p>{lead.requirements || "No requirements added."}</p>
      </SurfaceCard>

      <SurfaceCard>
        <h2 className="text-lg font-semibold mb-3">Notes</h2>

        {lead.notes?.length ? (
          lead.notes.map((note, index) => (
            <div key={index} className="mb-3 border-b pb-2">
              <p>{note.text}</p>
              <small>{new Date(note.createdAt).toLocaleString()}</small>
            </div>
          ))
        ) : (
          <p>No notes available.</p>
        )}
      </SurfaceCard>

      <div className="flex gap-3">
        <button className="btn-secondary" onClick={() => navigate("/leads")}>
          Back
        </button>

        <button className="btn-primary" onClick={convertLead}>
          Convert To Client
        </button>
      </div>
    </div>
  );
}
