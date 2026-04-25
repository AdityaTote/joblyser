import sys

from app.worker import worker as app


def main() -> None:
	if len(sys.argv) == 1:
		argv = [
			"worker",
			"--loglevel=info",
			"--queues=ai-agent-worker",
			"--pool=prefork",
			"--concurrency=4",
			"--max-tasks-per-child=50",
		]
	else:
		argv = sys.argv[1:]
	app.start(argv=argv)

if __name__ == "__main__":
    main()