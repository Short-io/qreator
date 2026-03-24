export async function deflate(data: Uint8Array): Promise<Uint8Array> {
    const cs = new CompressionStream("deflate");
    const writer = cs.writable.getWriter();
    writer.write(data as Uint8Array<ArrayBuffer>);
    writer.close();
    return collect(cs.readable);
}

export async function inflate(data: Uint8Array): Promise<Uint8Array> {
    const ds = new DecompressionStream("deflate");
    const writer = ds.writable.getWriter();
    writer.write(data as Uint8Array<ArrayBuffer>);
    writer.close();
    return collect(ds.readable);
}

async function collect(readable: ReadableStream<Uint8Array>): Promise<Uint8Array> {
    const reader = readable.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
    }
    const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
    }
    return result;
}
