import fsp from "@absolunet/fsp"
import delay from "delay"
import FormData from "form-data"
import getPort from "get-port"
import JaidCore from "jaid-core"
import ms from "ms.macro"
import nanoid from "nanoid"
import path from "path"

const indexModule = (process.env.MAIN ? path.resolve(process.env.MAIN) : path.join(__dirname, "..", "src")) |> require

/**
 * @type { import("../src") }
 */
const {default: JaidCoreDashboard} = indexModule

it("should run", async () => {
  let statusCode
  const insecurePort = await getPort()
  const dashboardPassword = nanoid()
  const dashboardPlugin = new JaidCoreDashboard()
  const core = new JaidCore({
    insecurePort,
    name: _PKG_TITLE,
    folder: ["Jaid", _PKG_TITLE, "test", new Date().toISOString()],
    version: _PKG_VERSION,
    useGot: true,
  })
  const secretsFile = path.join(core.appFolder, "secrets.yml")
  await fsp.writeYaml(secretsFile, {
    dashboardPassword,
    formAction: "/status",
  })
  const testClientClass = class {

    init() {
      /**
       * @type {import("got").Got}
       */
      this.got = core.got.extend({
        prefixUrl: "http://localhost",
        port: insecurePort,
      })
    }

    async ready() {
      core.logger.info(`Link: http://localhost:${insecurePort}/status`)
      core.logger.error("This will be\na multiline message.")
      const initialResponse = await this.got("status")
      await fsp.outputFile(path.join(__dirname, "..", "dist", "test", "login.html"), initialResponse.body)
      expect(initialResponse.statusCode).toBe(200)
      expect(initialResponse.body).toMatch("action=\"/status\"")
      const form = new FormData
      form.append("password", dashboardPassword)
      await this.got.post("status", {
        body: form,
      })
      const loggedInResponse = await this.got("status", {
        headers: {
          Cookie: `dashboardPassword=${dashboardPassword}`,
        },
      })
      statusCode = loggedInResponse.statusCode
      await fsp.outputFile(path.join(__dirname, "..", "dist", "test", "status.html"), loggedInResponse.body)
      expect(loggedInResponse.body).toMatch(`Started insecure server on port ${insecurePort}`)
    }

  }
  await core.init({
    dashboard: dashboardPlugin,
    test: testClientClass,
  })
  await delay(ms`30 seconds`)
  expect(statusCode).toBe(200)
  await core.close()
}, ms`40 seconds`)