provider "null" {}

resource "null_resource" "start_minikube" {
  # Add triggers to force recreation when needed
  triggers = {
    always_run = "${timestamp()}"  # This will make it run on every apply
  }

  provisioner "local-exec" {
    command = <<EOT
      if ! command -v minikube >/dev/null; then
        echo "Minikube is not installed. Aborting."
        exit 1
      fi

      minikube status || minikube start --driver=docker
    EOT
    interpreter = ["/bin/bash", "-c"]
  }
}
