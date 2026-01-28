import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const MaterialsRemoved = () => {
  const navigate = useNavigate();

  useEffect(() => {
    toast.info("עמוד זה הוסר מהמערכת");
    navigate("/courses", { replace: true });
  }, [navigate]);

  return null;
};

export default MaterialsRemoved;
