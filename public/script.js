document.addEventListener('DOMContentLoaded', function () {
  const socket = io();
  socket.on('update', function (data) {
    const containerStats = JSON.parse(data).sort((a, b) => {
      return b.cpu_stats.cpu_usage.total_usage - a.precpu_stats.cpu_usage.total_usage; // Sorting containers by CPU usage
    });
    const containersDiv = document.getElementById('containers');
    containersDiv.innerHTML = ''; // Clear existing data

    let totalCpuUsage = 0, totalMem = 0;
    let totalCPUs = containerStats[0]?.cpu_stats?.online_cpus || 1; // Assume all containers share the same CPU pool

    containerStats.forEach(stats => {
      const { readBytes, writeBytes } = extractIoData(stats.blkio_stats.io_service_bytes_recursive); // Extract I/O data
      const cpuPercentage = calculateCPUPercentage(stats).toFixed(2);
      const memoryUsage = (stats.memory_stats.usage / (1024 * 1024)).toFixed(2); // Convert to MB
      const memoryLimit = (stats.memory_stats.limit / (1024 * 1024)).toFixed(2); // Convert to MB

      totalCpuUsage += parseFloat(cpuPercentage);
      totalMem += parseFloat(memoryUsage);

      // Update HTML string to use readBytes and writeBytes
      containersDiv.innerHTML += `<tr>
          <td>docker</td>
          <td>-</td>
          <td>${stats.name.substring(1)}</td>
          <td>${cpuPercentage}</td>
          <td>${memoryUsage} MB</td>
          <td>${memoryLimit} MB</td>
          <td>${formatBytes(readBytes)}</td>
          <td>${formatBytes(writeBytes)}</td>
          <td>${formatBytes(stats.networks.eth0?.rx_bytes ?? 0)}</td>
          <td>${formatBytes(stats.networks.eth0?.tx_bytes ?? 0)}</td>
      </tr>`;
    });

    const maxPossibleCpuPercentage = totalCPUs * 100; // Maximum possible CPU percentage
    const formattedCpuUsage = `${totalCpuUsage.toFixed(2)}% / ${maxPossibleCpuPercentage.toFixed(0)}%`;

    // Display totals in footer
    document.getElementById('totals').innerHTML = `<td colspan="3">Total</td><td>${formattedCpuUsage}</td><td>${totalMem.toFixed(2)} MB</td><td colspan="4"></td>`;
  });

  function calculateCPUPercentage(stats) {
    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
    const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
    const numberCpus = stats.cpu_stats.online_cpus;
    return (cpuDelta / systemDelta) * numberCpus * 100.0;
  }

  function formatBytes(bytes) {
    if (!bytes) return '0 B'; // Safe check in case bytes are undefined or null
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function extractIoData(ioServiceBytesRecursive) {
    let readBytes = 0;
    let writeBytes = 0;

    if (ioServiceBytesRecursive) {  // Ensure the data is not null/undefined
        ioServiceBytesRecursive.forEach(io => {
            if (io.op === 'read') {
                readBytes += io.value;
            } else if (io.op === 'write') {
                writeBytes += io.value;
            }
        });
    }

    return { readBytes, writeBytes };
  }

});
