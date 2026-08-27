import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ImagePlus, Trash2, UploadCloud, Images, Loader2,
  Info, X, CheckCircle2
} from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import { getSalon, uploadSalonImages, removeSalonImage } from "../../services/salonService";

const API_BASE = "http://localhost:5000";

const toAbsolute = (path) => {
  if (!path) return "";
  return path.startsWith("http") ? path : `${API_BASE}/${path.replace(/\\/g, "/")}`;
};

const getFilename = (path) => (path || "").split("/").pop();

export default function SalonPhotos() {
  const params = useParams();
  let salonId = params.salonId;
  if (!salonId) {
    const match = window.location.pathname.match(/^\/salon-admin\/([^/]+)/);
    if (match) salonId = match[1];
  }

  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [removing, setRemoving] = useState("");
  const [message, setMessage] = useState(null);
  const fileInputRef = useRef(null);

  const fetchSalon = () => {
    return getSalon(salonId)
      .then((res) => {
        setSalon(res.data || res);
      })
      .catch((err) => {
        console.error(err);
        setMessage({ type: "error", text: err.response?.data?.message || "Failed to load salon photos." });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSalon();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salonId]);

  useEffect(() => {
    return () => previews.forEach((p) => URL.revokeObjectURL(p));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setSelectedFiles((prev) => [...prev, ...files]);
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = "";
  };

  const removeFromQueue = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setMessage(null);
    try {
      await uploadSalonImages(salonId, selectedFiles);
      setSelectedFiles([]);
      setPreviews([]);
      setMessage({ type: "success", text: "Photos uploaded successfully!" });
      await fetchSalon();
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to upload photos." });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (path) => {
    if (!window.confirm("Remove this photo from the salon gallery?")) return;
    const filename = getFilename(path);
    setRemoving(filename);
    setMessage(null);
    try {
      await removeSalonImage(salonId, filename);
      setMessage({ type: "success", text: "Photo removed." });
      await fetchSalon();
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to remove photo." });
    } finally {
      setRemoving("");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const existingImages = salon?.images || [];

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        title="Salon Photos"
        subtitle={salon?.name ? `Manage the public photo gallery for ${salon.name}` : "Manage your salon's public photo gallery"}
        backTo="adminDashboard"
      >
        <Button variant="primary" icon={ImagePlus} onClick={() => fileInputRef.current?.click()}>
          Add Photos
        </Button>
      </PageHeader>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Status Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold ${
              message.type === "success"
                ? "bg-info-dim border-info-border text-info"
                : "bg-danger-dim border-danger-border text-danger"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <X className="w-4 h-4" />
            )}
            <span className="flex-1">{message.text}</span>
            <button onClick={() => setMessage(null)} className="opacity-60 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Files Pending Upload */}
      {selectedFiles.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-accent" />
              {selectedFiles.length} photo{selectedFiles.length > 1 ? "s" : ""} ready to upload
            </h3>
            <span className="text-xs text-neutral-400 font-medium">
              Customers will see these in the salon gallery
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-5">
            {previews.map((src, i) => (
              <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-border bg-surface-2">
                <img src={src} alt={`Selected ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => removeFromQueue(i)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-md bg-black/60 text-red-400 flex items-center justify-center hover:bg-red-950/80 transition-all opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <Button variant="ghost" size="sm" onClick={() => { setSelectedFiles([]); setPreviews([]); }} disabled={uploading}>
              Clear
            </Button>
            <Button variant="primary" size="sm" onClick={handleUpload} loading={uploading}>
              {uploading ? "Uploading..." : `Upload ${selectedFiles.length === 1 ? "Photo" : selectedFiles.length + " Photos"}`}
            </Button>
          </div>
        </div>
      )}

      {/* Existing Gallery */}
      <div className="bg-surface border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Images className="w-4 h-4 text-accent" />
            Gallery Photos
            <span className="px-2 py-0.5 rounded-full bg-surface-2 border border-border text-xs font-bold text-neutral-400">
              {existingImages.length}
            </span>
          </h3>
          <span className="text-xs text-neutral-400 font-medium hidden sm:block">
            Manager & Super Admin only — customers view only
          </span>
        </div>

        {existingImages.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-surface-2 border border-border flex items-center justify-center mb-4">
              <Images className="w-8 h-8 text-neutral-500" />
            </div>
            <p className="text-white font-bold mb-1">No gallery photos yet</p>
            <p className="text-xs text-neutral-400 mb-5">
              Upload interior photos, team shots and more to showcase this salon.
            </p>
            <Button variant="primary" icon={ImagePlus} onClick={() => fileInputRef.current?.click()}>
              Upload First Photo
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {existingImages.map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className="relative group aspect-square rounded-xl overflow-hidden border border-border bg-surface-2"
              >
                <img
                  src={toAbsolute(img)}
                  alt={`${salon?.name || "Salon"} ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center">
                  <button
                    onClick={() => handleRemove(img)}
                    disabled={removing === getFilename(img)}
                    className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold flex items-center gap-1.5 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-red-700 disabled:opacity-50"
                  >
                    {removing === getFilename(img) ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    Remove
                  </button>
                </div>

                {i === 0 && (
                  <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-accent text-black text-[0.6rem] font-black uppercase tracking-wider">
                    Cover
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Info note */}
      <div className="flex items-start gap-3 bg-surface border border-border rounded-xl px-4 py-3 text-xs text-neutral-400">
        <Info className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
        <p>
          These photos appear on the public salon details page that customers visit. The first photo
          is used as the cover image on salon cards. You can add up to 10 photos at a time.
        </p>
      </div>
    </div>
  );
}

