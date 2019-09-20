import path from "path"

import JaidCore from "jaid-core"
import getPort from "get-port"

const indexModule = (process.env.MAIN ? path.resolve(process.env.MAIN) : path.join(__dirname, "..", "src")) |> require

/**
 * @type { import("../src") }
 */
const {default: JaidCoreDashboard} = indexModule

it("should run", async () => {
  const insecurePort = await getPort()
  const dashboardPlugin = new JaidCoreDashboard()
  const core = new JaidCore({
    insecurePort,
    name: _PKG_TITLE,
    folder: ["Jaid", _PKG_TITLE, "test", new Date().toISOString()],
    version: _PKG_VERSION,
  })
  await core.init({
    dashboard: dashboardPlugin,
  })
  await core.close()
})