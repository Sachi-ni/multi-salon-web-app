import helmet from "helmet";

export default helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
});