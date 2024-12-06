import { defineConfig } from '@abstract-money/cli'
import { react, registry, vanilla } from '@abstract-money/cli/plugins'

export default defineConfig({
  out: 'app/_generated/generated-abstract',
  contracts: [
    {
      name: "my_app",
      path: "../contracts/my_app/schema/abstract",
      namespace: "xion-wallet",
      version: "0.1.0",
      moduleType: "app",
    },
    //     {
    //       name: "my_adapter",
    //       path: "../contracts/my_adapter/schema/abstract",
    //       namespace: "xion-wallet",
    //       version: "0.1.0",
    //       moduleType: "adapter",
    //     }
    //     {
    //       name: "my_standalone",
    //       // standalone contracts don't use the abstract folder
    //       path: "../contracts/my_standalone/schema",
    //       namespace: "xion-wallet",
    //       version: "0.1.0",
    //     }
  ],
  plugins: [
    react({
      disableAbstractAppFor: ['cw20-base']
    }),
    vanilla({
      enableAbstractAppFor: [
        'my_app',
        // 'my_adapter',
      ]
    }),
    registry({
      contracts: [{
        namespace: 'cw-plus',
        name: 'cw20-base',
        version: '1.0.1'
      }]
  })],
})
