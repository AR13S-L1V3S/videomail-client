import zora from 'zora'
import clientTest from './core/client.test.js'

const plan = zora()
  .test(clientTest)

plan.run()
