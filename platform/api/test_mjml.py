import os
import subprocess
import tempfile

def test_mjml(width_attr=""):
    mjml = f"""<mjml>
  <mj-body width="600px">
    <mj-section padding="0px 24px">
      <mj-column>
        <mj-image src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1120&q=80" {width_attr} padding="0" fluid-on-mobile="true" />
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>"""
    fd, tmp_path = tempfile.mkstemp(suffix=".mjml")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write(mjml)
        result = subprocess.run(
            ["mjml", tmp_path, "-s"],
            capture_output=True,
            text=True,
            shell=os.name == "nt"
        )
        if result.returncode != 0:
            print(f"FAILED width_attr='{width_attr}':", result.stderr.strip()[:100])
        else:
            print(f"SUCCESS width_attr='{width_attr}': length={len(result.stdout)}")
            print("Snippet:", result.stdout[result.stdout.find("<img"):result.stdout.find("<img")+200])
    finally:
        os.remove(tmp_path)

test_mjml('width="100%"')
test_mjml('width="600px"')
test_mjml('')
