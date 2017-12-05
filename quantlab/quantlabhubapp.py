import os
from .quantlabapp import QuantLabApp

try:
    from jupyterhub.singleuser import SingleUserNotebookApp
except ImportError:
    SingleUserQuantLabApp = None
    raise ImportError('You must have jupyterhub installed for this to work.')
else:
    class SingleUserQuantLabApp(SingleUserNotebookApp, QuantLabApp):

        def init_webapp(self, *args, **kwargs):
            super().init_webapp(*args, **kwargs)
            settings = self.web_app.settings
            if 'page_config_data' not in settings:
                settings['page_config_data'] = {}
            settings['page_config_data']['hub_prefix'] = self.hub_prefix
            settings['page_config_data']['hub_host'] = self.hub_host
            settings['page_config_data']['hub_user'] = self.user
            api_token = os.getenv('JUPYTERHUB_API_TOKEN')
            if not api_token:
                api_token = ''
            if not self.token:
                try:
                    self.token = api_token
                except AttributeError:
                    self.log.error("Can't set self.token")
            settings['page_config_data']['token'] = api_token


def main(argv=None):
    return SingleUserQuantLabApp.launch_instance(argv)


if __name__ == "__main__":
    main()
