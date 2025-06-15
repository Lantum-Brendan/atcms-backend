const handleModalSubmit = async (instruction: string, files: File[]) => {
  if (!selectedComplaint?.id && !selectedComplaint?._id) return;

  try {
    const formData = new FormData();
    formData.append('instructions', instruction);
    files.forEach(file => {
      formData.append('files', file);
    });

    const complaintId = selectedComplaint.id || selectedComplaint._id;
    if (!complaintId) return;

    const updatedComplaint = await escalateComplaint(complaintId, formData);
    
    setComplaints(prevComplaints =>
      prevComplaints.map(complaint =>
        (complaint.id === complaintId || complaint._id === complaintId) ? updatedComplaint : complaint
      )
    );

    setIsModalOpen(false);
    toast.success('Complaint escalated successfully');
  } catch (error: any) {
    console.error('Escalation error:', error);
    toast.error(error.response?.data?.message || 'Failed to escalate complaint');
  }
}; 