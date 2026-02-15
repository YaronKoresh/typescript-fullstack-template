import process from "node:process";

const BASE_PORT = process.env.PORT || 8080;
const BALANCER_CHILDS = 2 as const;

export { BALANCER_CHILDS, BASE_PORT };
