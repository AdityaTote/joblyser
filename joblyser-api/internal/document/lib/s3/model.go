package s3

type S3Params struct {
	Region     string
	AccessKey  string
	SecretKey  string
	BucketName string
}

type PresignPutObjectResult struct {
	URL string
	Key string
}
